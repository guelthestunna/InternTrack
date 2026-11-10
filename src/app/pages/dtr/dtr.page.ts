import { Component, ChangeDetectorRef, inject, type OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonContent, IonIcon, type ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cafeOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  downloadOutline,
  timeOutline
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

// calendar day interface
interface CalendarDay {
  date: Date;
  key: string;
  number: number;
  label: string;
  fullLabel: string;
}

// attendance record interface
interface DtrRecord {
  date: string;
  timeIn: string;
  timeOut: string;
  status: 'verified' | 'provisional';
}

@Component({
  selector: 'app-dtr',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './dtr.page.html',
  styleUrls: ['./dtr.page.scss']
})
export class DtrPage implements ViewWillEnter, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private supabase = this.supabaseService.getClient();

  // Ensures the template re-evaluates bindings immediately after the async
  // Supabase load, instead of waiting for a user click to trigger change detection.
  private readonly cdRef = inject(ChangeDetectorRef);
  private destroyed = false;

  studentId = '';

  // calendar settings
  calendarMode: 'weekly' | 'monthly' = 'weekly';
  selectedDate: Date = new Date();
  weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // ojt hours
  requiredHours = 486;
  verifiedHours = 0.0;
  provisionalHours = 0.0;

  records: DtrRecord[] = [];

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      cafeOutline,
      checkmarkCircleOutline,
      timeOutline,
      downloadOutline
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private refresh(): void {
    if (!this.destroyed) {
      this.cdRef.detectChanges();
    }
  }

  async ionViewWillEnter(): Promise<void> {
    const id =
      this.route.snapshot.queryParamMap.get('studentId') ||
      this.authService.getStudentId() ||
      localStorage.getItem('studentId');

    if (!id) {
      console.error('DTR: no student ID found. The login flow did not store it.');
      this.studentId = '';
      this.records = [];
      this.verifiedHours = 0;
      this.provisionalHours = 0;
      this.refresh();
      return;
    }

    this.studentId = id;
    await this.loadAttendanceFromSupabase();
  }

  // format date key
  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // create calendar day
  private createDay(date: Date): CalendarDay {
    const copy = new Date(date);

    return {
      date: copy,
      key: this.dateKey(copy),
      number: copy.getDate(),
      label: copy.toLocaleDateString('en-US', {
        weekday: 'short'
      }).toUpperCase(),
      fullLabel: copy.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    };
  }

  // date labels
  get monthLabel(): string {
    return this.selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }

  get selectedDateLabel(): string {
    return this.selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // weekly calendar
  get weeklyDays(): CalendarDay[] {
    const start = new Date(this.selectedDate);
    start.setDate(start.getDate() - start.getDay());

    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(this.createDay(date));
    }

    return days;
  }

  // monthly calendar
  get monthlyDays(): (CalendarDay | null)[] {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(this.createDay(new Date(year, month, i)));
    }

    return days;
  }

  setCalendarMode(mode: 'weekly' | 'monthly'): void {
    this.calendarMode = mode;
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(date);
  }

  isSelected(key: string): boolean {
    return this.dateKey(this.selectedDate) === key;
  }

  changePeriod(direction: number): void {
    const current = new Date(this.selectedDate);

    if (this.calendarMode === 'weekly') {
      current.setDate(current.getDate() + direction * 7);
      this.selectedDate = current;
    } else {
      const year = current.getFullYear();
      const month = current.getMonth() + direction;
      const day = current.getDate();
      const targetStart = new Date(year, month, 1);
      const lastDay = new Date(
        targetStart.getFullYear(),
        targetStart.getMonth() + 1,
        0
      ).getDate();

      this.selectedDate = new Date(
        targetStart.getFullYear(),
        targetStart.getMonth(),
        Math.min(day, lastDay)
      );
    }
  }

  getMarker(date: string): 'verified' | 'provisional' | null {
    const record = this.records.find(item => item.date === date);
    return record?.status ?? null;
  }

  get selectedRecord(): DtrRecord | undefined {
    const selectedKey = this.dateKey(this.selectedDate);
    return this.records.find(record => record.date === selectedKey);
  }

  get totalHours(): number {
    return parseFloat((this.verifiedHours + this.provisionalHours).toFixed(1));
  }

  get remainingHours(): number {
    return Math.max(0, this.requiredHours - this.totalHours);
  }

  // Load real logs from Supabase and calculate hours dynamically
  async loadAttendanceFromSupabase(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('student_id', this.studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        let verifiedMinutes = 0;
        let provisionalMinutes = 0;

        this.records = data.map(row => {
          const dateStr = row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
          const formattedIn = row.time_in ? new Date(row.time_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--';
          const formattedOut = row.time_out ? new Date(row.time_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

          // Calculate hours if both time in and out exist
          let minutes = 0;
          if (row.time_in && row.time_out) {
            const diffMs = new Date(row.time_out).getTime() - new Date(row.time_in).getTime();
            if (diffMs > 0) {
              minutes = Math.floor(diffMs / (1000 * 60));
            }
          }

          // Separate verified vs provisional based on verification_status
          const isVerified = row.verification_status === 'verified';
          if (isVerified) {
            verifiedMinutes += minutes;
          } else {
            provisionalMinutes += minutes;
          }

          return {
            date: dateStr,
            timeIn: formattedIn,
            timeOut: formattedOut,
            status: isVerified ? 'verified' : 'provisional'
          };
        });

        this.verifiedHours = parseFloat((verifiedMinutes / 60).toFixed(1));
        this.provisionalHours = parseFloat((provisionalMinutes / 60).toFixed(1));
      } else {
        // Reset state when no data
        this.verifiedHours = 0;
        this.provisionalHours = 0;
        this.records = [];
      }
    } catch (err) {
      console.error('DTR: loadAttendanceFromSupabase error:', err);
      this.records = [];
      this.verifiedHours = 0;
      this.provisionalHours = 0;
    } finally {
      this.refresh();
    }
  }

  exportDtr(): void {
    const header = ['Date', 'Time In', 'Time Out', 'Status'];

    const rows = this.records
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(record => [
        record.date,
        record.timeIn,
        record.timeOut || 'Not recorded',
        record.status
      ]);

    const escapeCell = (value: string): string => {
      const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    };

    const csv = [header, ...rows]
      .map(row => row.map(escapeCell).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'InternTrack-DTR-Live.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async previewDtr(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Live DTR Preview',
      message:
        `Total Verified: ${this.verifiedHours.toFixed(1)} hrs` +
        `<br>Provisional: ${this.provisionalHours.toFixed(1)} hrs` +
        `<br>Total Completed: ${this.totalHours.toFixed(1)} hrs` +
        `<br>Required: ${this.requiredHours} hrs` +
        `<br><br>Synced directly with Supabase.`,
      buttons: ['Close']
    });

    await alert.present();
  }
}