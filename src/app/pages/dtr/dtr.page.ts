import { Component } from '@angular/core';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  chevronBackOutline,
  chevronForwardOutline,
  cafeOutline,
  checkmarkCircleOutline,
  timeOutline,
  downloadOutline
} from 'ionicons/icons';

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

// dtr page
@Component({
  selector: 'app-dtr',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './dtr.page.html',
  styleUrls: ['./dtr.page.scss']
})
export class DtrPage {

  // calendar settings
  calendarMode: 'weekly' | 'monthly' = 'weekly';
  selectedDate: Date = new Date(2026, 9, 28);
  weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // ojt hours
  requiredHours = 456;
  verifiedHours = 196.0;
  provisionalHours = 16.5;

  // demo attendance records
  private demoRecords: DtrRecord[] = [
    {
      date: '2026-10-25',
      timeIn: '8:00 AM',
      timeOut: '5:00 PM',
      status: 'verified'
    },
    {
      date: '2026-10-26',
      timeIn: '8:04 AM',
      timeOut: '5:01 PM',
      status: 'verified'
    },
    {
      date: '2026-10-27',
      timeIn: '7:58 AM',
      timeOut: '5:06 PM',
      status: 'provisional'
    }
  ];

  records: DtrRecord[] = [...this.demoRecords];

  constructor(private alertController: AlertController) {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      cafeOutline,
      checkmarkCircleOutline,
      timeOutline,
      downloadOutline
    });
  }

  // refresh attendance on page entry
  ionViewWillEnter(): void {
    this.loadAttendance();
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

  // calendar interactions
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

  // calendar record status
  getMarker(date: string): 'verified' | 'provisional' | null {
    const record = this.records.find(item => item.date === date);
    return record?.status ?? null;
  }

  get selectedRecord(): DtrRecord | undefined {
    const selectedKey = this.dateKey(this.selectedDate);
    return this.records.find(record => record.date === selectedKey);
  }

  // hour totals
  get totalHours(): number {
    return this.verifiedHours + this.provisionalHours;
  }

  get remainingHours(): number {
    return Math.max(0, this.requiredHours - this.totalHours);
  }

  // load locally saved attendance
  loadAttendance(): void {
    this.records = [...this.demoRecords];

    const saved = localStorage.getItem('interntrack_attendance_demo');
    if (!saved) return;

    try {
      const record = JSON.parse(saved);

      if (
        typeof record.date !== 'string' ||
        typeof record.timeIn !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(record.date) ||
        !record.timeIn
      ) {
        return;
      }

      const localRecord: DtrRecord = {
        date: record.date,
        timeIn: record.timeIn,
        timeOut: typeof record.timeOut === 'string' ? record.timeOut : '',
        status: 'provisional'
      };

      this.records = this.records.filter(
        item => item.date !== localRecord.date
      );

      this.records.push(localRecord);
    } catch {
      console.warn('Invalid local attendance record.');
    }
  }

  // export dtr to csv
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
    link.download = 'InternTrack-DTR-Demo.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // preview dtr
  async previewDtr(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'DTR Preview',
      message:
        `Total Verified: ${this.verifiedHours.toFixed(1)} hrs` +
        `<br>Provisional: ${this.provisionalHours.toFixed(1)} hrs` +
        `<br>Total Completed: ${this.totalHours.toFixed(1)} hrs` +
        `<br>Required: ${this.requiredHours} hrs` +
        `<br><br>Frontend demonstration only.`,
      buttons: ['Close']
    });

    await alert.present();
  }
}