import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Subject } from 'rxjs';

import { SupabaseService } from './supabase.service';

export interface PendingAttendance {
  id: string;
  student_id: string;
  client_transaction_id?: string;
  time_in?: string;
  time_out?: string;
  time_in_photo?: Blob;
  time_out_photo?: Blob;
  time_in_photo_path?: string;
  time_out_photo_path?: string;
  time_in_location_lat?: number;
  time_in_location_long?: number;
  time_out_location_lat?: number;
  time_out_location_long?: number;
  status: string;
  created_at: string;
  sync_status: 'pending' | 'synced' | 'failed';   // 'failed' = gave up after MAX_RETRIES
  retry_count: number;
  last_retry_at?: string;
  last_error?: string;
}

export interface SyncState { pending: number; failed: number; syncing: boolean; }

interface PhotoRecord {
  id: string;
  blob: Blob;
  type: 'time_in' | 'time_out';
  attendance_id: string;
}

const DB_NAME = 'InternTrackOffline';
const DB_VERSION = 1;
const ATTENDANCE_STORE = 'pending_attendance';
const PHOTO_STORE = 'photos';
const PHOTO_BUCKET = 'attendance-photos';
const MAX_RETRIES = 6;
const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 15 * 60_000;

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private syncStateSubject = new BehaviorSubject<SyncState>({ pending: 0, failed: 0, syncing: false });
  private syncedSubject = new Subject<void>();
  private pendingAttendance: PendingAttendance[] = [];
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private dbReady: Promise<void>;
  private loaded: Promise<void>;

  isOnline$ = this.isOnlineSubject.asObservable();
  syncState$ = this.syncStateSubject.asObservable();
  /** emits after a run that synced at least one record, so pages can refresh */
  synced$ = this.syncedSubject.asObservable();

  private readonly supabase = inject(SupabaseService);

  constructor() {
    window.addEventListener('online', () => { this.isOnlineSubject.next(true); this.autoSync(); });
    window.addEventListener('offline', () => this.isOnlineSubject.next(false));

    this.dbReady = this.initDB();
    this.loaded = this.dbReady.then(() => this.loadPendingRecords());
    this.loaded.then(() => this.autoSync()).catch(err => console.error('Offline DB init failed:', err));

    // retries whose backoff has elapsed while the app stays open and online
    setInterval(() => this.autoSync(), 30_000);
  }

  get isOnline(): boolean { return this.isOnlineSubject.value; }

  // ---------- IndexedDB plumbing ----------

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
          const s = db.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id' });
          s.createIndex('sync_status', 'sync_status', { unique: false });
          s.createIndex('student_id', 'student_id', { unique: false });
          s.createIndex('client_transaction_id', 'client_transaction_id', { unique: true });
        }
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          const p = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
          p.createIndex('attendance_id', 'attendance_id', { unique: false });
        }
      };
    });
  }

  /** Resolves when the transaction COMMITS (not just when the request succeeds). */
  private async tx<T = void>(
    stores: string[],
    mode: IDBTransactionMode,
    work: (tx: IDBTransaction) => IDBRequest | void
  ): Promise<T> {
    await this.dbReady;
    const db = this.db;
    if (!db) throw new Error('Database not initialized');
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction(stores, mode);
      let req: IDBRequest | void;
      try { req = work(t); } catch (e) { t.abort(); reject(e); return; }
      t.oncomplete = () => resolve((req ? (req as IDBRequest).result : undefined) as T);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error ?? new Error('Transaction aborted'));
    });
  }

  private saveToIndexedDB(record: PendingAttendance) {
    return this.tx([ATTENDANCE_STORE], 'readwrite', t => t.objectStore(ATTENDANCE_STORE).put(record));
  }

  private loadFromIndexedDB() {
    return this.tx<PendingAttendance[]>([ATTENDANCE_STORE], 'readonly', t => t.objectStore(ATTENDANCE_STORE).getAll());
  }

  private async getPhoto(id: string): Promise<Blob | null> {
    const rec = await this.tx<PhotoRecord | undefined>([PHOTO_STORE], 'readonly', t => t.objectStore(PHOTO_STORE).get(id));
    return rec?.blob ?? null;
  }

  private async loadPendingRecords(): Promise<void> {
    try {
      this.pendingAttendance = await this.loadFromIndexedDB();
      for (const r of [...this.pendingAttendance]) {
        if (r.sync_status === 'synced') {
          await this.removeRecord(r.id);                  // purge leftovers
        } else if (r.sync_status === 'failed' && r.retry_count < MAX_RETRIES) {
          r.sync_status = 'pending';                      // un-stick records from the old logic
          await this.saveToIndexedDB(r);
        }
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      this.pendingAttendance = [];
    }
    this.emitState();
  }

  // ---------- public API ----------

  async saveOfflineAttendance(record: Omit<PendingAttendance, 'id' | 'sync_status' | 'retry_count'>): Promise<string> {
    await this.loaded;

    const id = this.generateId();
    const { time_in_photo, time_out_photo, ...rest } = record;
    const pending: PendingAttendance = {
      ...rest, id, sync_status: 'pending', retry_count: 0, created_at: new Date().toISOString()
    };

    const photos: PhotoRecord[] = [];
    if (time_in_photo) {
      pending.time_in_photo_path = `${id}-time-in`;
      photos.push({ id: pending.time_in_photo_path, blob: time_in_photo, type: 'time_in', attendance_id: id });
    }
    if (time_out_photo) {
      pending.time_out_photo_path = `${id}-time-out`;
      photos.push({ id: pending.time_out_photo_path, blob: time_out_photo, type: 'time_out', attendance_id: id });
    }

    // one transaction: either the record and its photos are saved, or none are
    await this.tx([ATTENDANCE_STORE, PHOTO_STORE], 'readwrite', t => {
      photos.forEach(p => t.objectStore(PHOTO_STORE).put(p));
      return t.objectStore(ATTENDANCE_STORE).put(pending);
    });

    this.pendingAttendance.push(pending);
    this.emitState();
    this.autoSync();
    return pending.id;
  }

  getPendingRecords(): PendingAttendance[] {
    return this.pendingAttendance.filter(r => r.sync_status === 'pending');
  }

  getFailedRecords(): PendingAttendance[] {
    return this.pendingAttendance.filter(r => r.sync_status === 'failed');
  }

  getAllRecords(): PendingAttendance[] { return this.pendingAttendance; }

  async markAsSynced(id: string): Promise<void> {
    await this.removeRecord(id);          // the real data now lives in Supabase
  }

  async markAsFailed(id: string, error?: unknown): Promise<void> {
    const record = this.pendingAttendance.find(r => r.id === id);
    if (!record) return;
    record.retry_count++;
    record.last_retry_at = new Date().toISOString();
    record.last_error = (error as any)?.message ?? String(error ?? 'Unknown error');
    record.sync_status = record.retry_count >= MAX_RETRIES ? 'failed' : 'pending';
    await this.saveToIndexedDB(record);
    this.emitState();
  }

  async removeRecord(id: string): Promise<void> {
    const record = this.pendingAttendance.find(r => r.id === id);
    await this.tx([ATTENDANCE_STORE, PHOTO_STORE], 'readwrite', t => {
      if (record?.time_in_photo_path) t.objectStore(PHOTO_STORE).delete(record.time_in_photo_path);
      if (record?.time_out_photo_path) t.objectStore(PHOTO_STORE).delete(record.time_out_photo_path);
      t.objectStore(ATTENDANCE_STORE).delete(id);
    });
    this.pendingAttendance = this.pendingAttendance.filter(r => r.id !== id);
    this.emitState();
  }

  async clearAllRecords(): Promise<void> {
    await this.tx([ATTENDANCE_STORE, PHOTO_STORE], 'readwrite', t => {
      t.objectStore(PHOTO_STORE).clear();
      t.objectStore(ATTENDANCE_STORE).clear();
    });
    this.pendingAttendance = [];
    this.emitState();
  }

  /** Re-queue records that hit MAX_RETRIES (for a "Retry failed" button). */
  async retryFailed(): Promise<void> {
    for (const r of this.pendingAttendance.filter(x => x.sync_status === 'failed')) {
      r.sync_status = 'pending';
      r.retry_count = 0;
      r.last_retry_at = undefined;
      await this.saveToIndexedDB(r);
    }
    this.emitState();
    await this.syncPendingRecords();
  }

  /** Manual sync (ignores backoff). The parameter is kept for compatibility and ignored. */
  async syncPendingRecords(_supabaseClient?: unknown): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) throw new Error('You are offline');
    return await this.runSync(true);
  }

  // ---------- sync engine ----------

  private async autoSync(): Promise<void> {
    try { await this.runSync(false); } catch (e) { console.error('Auto-sync error:', e); }
  }

  private isDue(r: PendingAttendance): boolean {
    if (r.sync_status !== 'pending') return false;
    if (!r.last_retry_at) return true;
    const delay = Math.min(BASE_DELAY_MS * 2 ** r.retry_count, MAX_DELAY_MS);
    return Date.now() >= new Date(r.last_retry_at).getTime() + delay;
  }

  private async runSync(force: boolean): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline || this.syncInProgress) return { synced: 0, failed: 0 };
    await this.loaded;

    const due = this.pendingAttendance
      .filter(r => (force ? r.sync_status === 'pending' : this.isDue(r)))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));   // time-in before time-out
    if (due.length === 0) return { synced: 0, failed: 0 };

    const client = this.supabase.getClient();
    const blocked = new Set<string>();     // if one record fails, hold back that student's later ones
    let synced = 0, failed = 0;

    this.syncInProgress = true;
    this.emitState();
    try {
      for (const record of due) {
        if (blocked.has(record.student_id)) continue;
        try {
          await this.syncOne(client, record);
          await this.markAsSynced(record.id);
          synced++;
        } catch (error) {
          console.error('Sync failed for record:', record.id, error);
          await this.markAsFailed(record.id, error);
          blocked.add(record.student_id);
          failed++;
        }
      }
    } finally {
      this.syncInProgress = false;
      this.emitState();
    }
    if (synced > 0) this.syncedSubject.next();
    return { synced, failed };
  }

  private async syncOne(client: SupabaseClient, record: PendingAttendance): Promise<void> {
    const timeInPhotoUrl = await this.uploadStoredPhoto(client, record.time_in_photo_path,
      `${record.student_id}-${record.id}-time-in`);
    const timeOutPhotoUrl = await this.uploadStoredPhoto(client, record.time_out_photo_path,
      `${record.student_id}-${record.id}-time-out`);

    if (record.time_in) {
      // DO NOTHING on conflict = safe if a previous attempt inserted but we crashed before cleanup
      const { error } = await client.from('attendance').upsert({
        student_id: record.student_id,
        client_transaction_id: record.client_transaction_id,
        time_in: record.time_in,
        time_in_photo: timeInPhotoUrl,
        time_in_location_lat: record.time_in_location_lat,
        time_in_location_long: record.time_in_location_long,
        status: record.status,
        sync_status: 'synced',
        verification_status: 'provisional'
      }, { onConflict: 'client_transaction_id', ignoreDuplicates: true });
      if (error) throw error;
      return;
    }

    if (record.time_out) {
      // already applied by an earlier attempt?
      const { data: applied, error: appliedErr } = await client.from('attendance').select('id')
        .eq('student_id', record.student_id).eq('time_out', record.time_out).limit(1);
      if (appliedErr) throw appliedErr;
      if (applied && applied.length > 0) return;

      const { data: open, error: findErr } = await client.from('attendance').select('id')
        .eq('student_id', record.student_id)
        .is('time_out', null)
        .lte('time_in', record.time_out)
        .order('time_in', { ascending: false })
        .limit(1);
      if (findErr) throw findErr;
      if (!open || open.length === 0) throw new Error('No open time-in found for this time-out');

      const { error } = await client.from('attendance').update({
        time_out: record.time_out,
        time_out_photo: timeOutPhotoUrl,
        time_out_location_lat: record.time_out_location_lat,
        time_out_location_long: record.time_out_location_long,
        verification_status: 'provisional'
      }).eq('id', open[0].id);
      if (error) throw error;
    }
  }

  private async uploadStoredPhoto(client: SupabaseClient, photoId: string | undefined, baseName: string): Promise<string | null> {
    if (!photoId) return null;
    const blob = await this.getPhoto(photoId);
    if (!blob) { console.warn('Photo blob missing for', photoId); return null; }
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    return this.uploadPhoto(client, blob, `${baseName}.${ext}`);
  }

  /** Throws on failure so the record is retried instead of syncing without its photo. */
  private async uploadPhoto(client: SupabaseClient, blob: Blob, fileName: string): Promise<string> {
    const { error } = await client.storage.from(PHOTO_BUCKET).upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: true                       // deterministic name + upsert = retries don't duplicate
    });
    if (error) throw error;
    return client.storage.from(PHOTO_BUCKET).getPublicUrl(fileName).data.publicUrl;
  }

  private emitState(): void {
    this.syncStateSubject.next({
      pending: this.pendingAttendance.filter(r => r.sync_status === 'pending').length,
      failed: this.pendingAttendance.filter(r => r.sync_status === 'failed').length,
      syncing: this.syncInProgress
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}