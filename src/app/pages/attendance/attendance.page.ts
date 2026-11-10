import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon, type ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkOutline,
  cloudOfflineOutline,
  logInOutline,
  logOutOutline
} from 'ionicons/icons';
import type { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { OfflineSyncService } from '../../services/offline-sync.service';
import { SupabaseService } from '../../services/supabase.service';

interface AttendanceLog {
  id: number;
  date: string;
  hours: string;
  status: 'pending' | 'synced';
}

interface LocationData {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ],
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss']
})
export class AttendancePage implements OnInit, OnDestroy, ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly supabaseService = inject(SupabaseService);
  // protected (not private) because the template calls getPendingRecords()
  protected readonly offlineSyncService = inject(OfflineSyncService);
  private readonly authService = inject(AuthService);
  private supabase = this.supabaseService.getClient();

  currentDate = '';
  currentTime = '';
  timePeriod = '';
  private clockInterval?: ReturnType<typeof setInterval>;
  private onlineSub?: Subscription;
  private destroyed = false;

  timeIn = '';
  timeOut = '';
  offlinePreview = false;
  syncMessage = '';
  studentId = '';

  // Photo and location data
  timeInPhoto: File | null = null;
  timeOutPhoto: File | null = null;
  timeInLocation: LocationData | null = null;
  timeOutLocation: LocationData | null = null;

  // Online status
  isOnline = true;

  recentLogs: AttendanceLog[] = [];

  private syncSub?: Subscription;

  constructor() {
    addIcons({
      cameraOutline,
      cloudOfflineOutline,
      logInOutline,
      logOutOutline,
      checkmarkOutline
    });
  }

  ngOnInit(): void {
    this.updateClock();

    // Subscribe to online status
    this.onlineSub = this.offlineSyncService.isOnline$.subscribe(online => {
      this.isOnline = online;
      this.offlinePreview = !online;
      this.refresh();

      // Auto-sync when online, only if something is actually pending
      if (online && this.offlineSyncService.getPendingRecords().length > 0) {
        this.syncPendingRecords();
      }
    });

    // Subscribe to sync completion to refresh UI
    this.syncSub = this.offlineSyncService.synced$.subscribe(() => {
      this.loadAttendanceFromSupabase();
      this.refresh();
    });

    this.clockInterval = setInterval(() => {
      this.updateClock();
      this.refresh();
    }, 1000);
  }

  // Data loads here (runs on first entry and every return to the tab)
  async ionViewWillEnter(): Promise<void> {
    const id =
      this.route.snapshot.queryParamMap.get('studentId') ||
      this.authService.getStudentId() ||
      localStorage.getItem('studentId');

    if (!id) {
      console.error('Attendance: no student ID found. The login flow did not store it.');
      this.studentId = '';
      this.recentLogs = [];
      this.timeIn = '';
      this.timeOut = '';
      this.refresh();
      return;
    }

    this.studentId = id;
    await this.loadAttendanceFromSupabase();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.onlineSub?.unsubscribe();
    this.syncSub?.unsubscribe();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  // Tell Angular to redraw (safe to call after async work)
  private refresh(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }

  async syncPendingRecords(): Promise<void> {
    try {
      const result = await this.offlineSyncService.syncPendingRecords();
      await this.loadAttendanceFromSupabase();

      if (result.synced > 0) {
        this.syncMessage = `${result.synced} record(s) synced successfully!`;
      } else if (result.failed > 0) {
        this.syncMessage = `${result.failed} record(s) failed to sync. Check your connection.`;
      } else {
        this.syncMessage = 'No records to sync.';
      }
    } catch (err) {
      console.error('Sync pending records error:', err);
      this.syncMessage = `Sync failed: ${(err as any)?.message || 'Unknown error'}`;
    } finally {
      this.refresh();
    }
  }

  async retryFailedSync(): Promise<void> {
    try {
      await this.offlineSyncService.retryFailed();
      const result = await this.offlineSyncService.syncPendingRecords();
      await this.loadAttendanceFromSupabase();

      if (result.synced > 0) {
        this.syncMessage = `${result.synced} record(s) synced successfully!`;
      } else if (result.failed > 0) {
        this.syncMessage = `${result.failed} record(s) failed to sync. Check your connection.`;
      } else {
        this.syncMessage = 'No records to sync.';
      }
    } catch (err) {
      console.error('Retry failed sync error:', err);
      this.syncMessage = `Retry failed: ${(err as any)?.message || 'Unknown error'}`;
    } finally {
      this.refresh();
    }
  }

  updateClock(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const parts = formattedTime.split(' ');
    this.currentTime = parts[0];
    this.timePeriod = parts[1] || '';
  }

  get attendanceStatus(): string {
    if (this.timeOut) return 'Timed Out';
    if (this.timeIn) return 'Timed In';
    return 'Not timed in';
  }

  async handlePhotoCapture(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    // Store the photo file
    this.timeInPhoto = file;

    // Capture location
    await this.captureLocation('in');

    // Capture triggered successfully; proceed with Time In recording
    const now = new Date();
    this.timeIn = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    this.refresh();

    await this.saveAttendanceToSupabase('in', now.toISOString());
  }

  async handleTimeOutPhotoCapture(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    // Store the photo file
    this.timeOutPhoto = file;

    // Capture location
    await this.captureLocation('out');

    const now = new Date();
    this.timeOut = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    this.refresh();

    await this.saveAttendanceToSupabase('out', now.toISOString());
  }

  async captureLocation(type: 'in' | 'out'): Promise<void> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported');
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          if (type === 'in') {
            this.timeInLocation = location;
          } else {
            this.timeOutLocation = location;
          }
          resolve();
        },
        (error) => {
          console.warn('Location capture failed:', error.message);
          // Continue without location - it's optional
          resolve();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  // Generate unique client transaction ID for offline sync idempotency
  private generateClientTransactionId(): string {
    return `${this.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveAttendanceToSupabase(type: 'in' | 'out', timestampIso: string): Promise<void> {
    // Check if online
    if (!this.isOnline) {
      // Save offline
      await this.saveOfflineAttendance(type, timestampIso);
      return;
    }

    try {
      // Upload photo to Supabase Storage if available
      let photoUrl: string | null = null;
      if (type === 'in' && this.timeInPhoto) {
        photoUrl = await this.uploadPhoto(this.timeInPhoto, 'time-in');
      } else if (type === 'out' && this.timeOutPhoto) {
        photoUrl = await this.uploadPhoto(this.timeOutPhoto, 'time-out');
      }

      const location = type === 'in' ? this.timeInLocation : this.timeOutLocation;
      const clientTransactionId = this.generateClientTransactionId();

      if (type === 'in') {
        const { error } = await this.supabase
          .from('attendance')
          .insert({
            student_id: this.studentId,
            client_transaction_id: clientTransactionId,
            time_in: timestampIso,
            time_in_photo: photoUrl,
            time_in_location_lat: location?.latitude || null,
            time_in_location_long: location?.longitude || null,
            status: 'Present',
            verification_status: 'provisional'
          });

        if (error) throw error;
      } else {
        const { data: latestData } = await this.supabase
          .from('attendance')
          .select('id')
          .eq('student_id', this.studentId)
          .is('time_out', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (latestData && latestData.length > 0) {
          const { error } = await this.supabase
            .from('attendance')
            .update({
              time_out: timestampIso,
              time_out_photo: photoUrl,
              time_out_location_lat: location?.latitude || null,
              time_out_location_long: location?.longitude || null,
              verification_status: 'provisional'
            })
            .eq('id', latestData[0].id);

          if (error) throw error;
        } else {
          const { error } = await this.supabase
            .from('attendance')
            .insert({
              student_id: this.studentId,
              client_transaction_id: clientTransactionId,
              time_out: timestampIso,
              time_out_photo: photoUrl,
              time_out_location_lat: location?.latitude || null,
              time_out_location_long: location?.longitude || null,
              status: 'Present',
              verification_status: 'provisional'
            });
          if (error) throw error;
        }
      }

      this.syncMessage = 'Attendance synced successfully to Supabase!';
      await this.loadAttendanceFromSupabase();
    } catch (err) {
      console.error('Supabase sync error:', err);
      this.syncMessage = 'Saved locally, server sync pending.';
      // Save offline as fallback
      await this.saveOfflineAttendance(type, timestampIso);
    } finally {
      this.refresh();
    }
  }

  async saveOfflineAttendance(type: 'in' | 'out', timestampIso: string): Promise<void> {
    try {
      const location = type === 'in' ? this.timeInLocation : this.timeOutLocation;
      const photo = type === 'in' ? this.timeInPhoto : this.timeOutPhoto;
      const clientTransactionId = this.generateClientTransactionId();

      // Convert File to Blob for IndexedDB storage
      let photoBlob: Blob | undefined = undefined;
      if (photo) {
        photoBlob = new Blob([photo], { type: photo.type });
      }

      await this.offlineSyncService.saveOfflineAttendance({
        student_id: this.studentId,
        client_transaction_id: clientTransactionId,
        time_in: type === 'in' ? timestampIso : undefined,
        time_out: type === 'out' ? timestampIso : undefined,
        time_in_photo: type === 'in' ? photoBlob : undefined,
        time_out_photo: type === 'out' ? photoBlob : undefined,
        time_in_location_lat: type === 'in' ? location?.latitude : undefined,
        time_in_location_long: type === 'in' ? location?.longitude : undefined,
        time_out_location_lat: type === 'out' ? location?.latitude : undefined,
        time_out_location_long: type === 'out' ? location?.longitude : undefined,
        status: 'Present',
        created_at: new Date().toISOString()
      });

      this.syncMessage = 'Saved offline. Will sync when online.';
      this.offlinePreview = true;
    } catch (err) {
      console.error('Offline save error:', err);
      this.syncMessage = `Failed to save offline: ${(err as any)?.message || 'Unknown error'}`;
    } finally {
      this.refresh();
    }
  }

  async uploadPhoto(file: File, type: string): Promise<string | null> {
    try {
      const fileName = `${this.studentId}-${type}-${Date.now()}.jpg`;
      const filePath = `attendance/${fileName}`;

      const { error } = await this.supabase.storage
        .from('attendance-photos')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('attendance-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Photo upload error:', err);
      return null;
    }
  }

  async loadAttendanceFromSupabase(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('student_id', this.studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Reset today's state so a previous day or student doesn't linger
      this.timeIn = '';
      this.timeOut = '';

      if (data && data.length > 0) {
        const todayStr = new Date().toDateString();
        const todayRecord = data.find(row => new Date(row.created_at).toDateString() === todayStr);

        if (todayRecord) {
          if (todayRecord.time_in) {
            this.timeIn = new Date(todayRecord.time_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          }
          if (todayRecord.time_out) {
            this.timeOut = new Date(todayRecord.time_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          }
        }

        this.recentLogs = data.map((row, index) => {
          const formattedDate = new Date(row.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const formattedIn = row.time_in ? new Date(row.time_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--';
          const formattedOut = row.time_out ? new Date(row.time_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--';

          return {
            id: index + 1,
            date: formattedDate,
            hours: `${formattedIn} - ${formattedOut}`,
            status: row.sync_status === 'synced' ? 'synced' : 'pending'
          };
        });
      } else {
        this.recentLogs = [];
      }
    } catch (err) {
      console.error('Could not load attendance logs:', err);
    } finally {
      // Data arrives after the first render, so tell Angular to redraw
      this.refresh();
    }
  }

  retrySync(): void {
    // Sync pending offline records
    this.offlineSyncService.syncPendingRecords(this.supabase)
      .then(() => this.loadAttendanceFromSupabase())
      .catch(err => {
        console.error('Retry sync error:', err);
        this.syncMessage = 'Failed to sync offline records.';
        this.refresh();
      });
  }
}