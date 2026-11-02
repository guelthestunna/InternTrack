import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  cloudOfflineOutline,
  logInOutline,
  logOutOutline,
  checkmarkOutline
} from 'ionicons/icons';


// attendance log interface
interface AttendanceLog {
  id: number;
  date: string;
  hours: string;
  status: 'pending' | 'synced';
}


// attendance page
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

export class AttendancePage implements OnInit, OnDestroy {

  // current date and time
  currentDate = '';
  currentTime = '';
  timePeriod = '';

  private clockInterval?: ReturnType<typeof setInterval>;

  // attendance status
  timeIn = '';
  timeOut = '';

  // offline preview
  offlinePreview = true;
  syncMessage = '';

  // recent logs
  recentLogs: AttendanceLog[] = [
    {
      id: 1,
      date: 'Tue, Oct 27',
      hours: '7:58 AM - 5:06 PM',
      status: 'pending'
    },
    {
      id: 2,
      date: 'Mon, Oct 26',
      hours: '8:04 AM - 5:01 PM',
      status: 'synced'
    },
    {
      id: 3,
      date: 'Fri, Oct 23',
      hours: '7:55 AM - 4:59 PM',
      status: 'synced'
    },
    {
      id: 4,
      date: 'Thu, Oct 22',
      hours: '8:04 AM - 5:01 PM',
      status: 'synced'
    }
  ];


  // register icons
  constructor() {
    addIcons({
      cloudOfflineOutline,
      logInOutline,
      logOutOutline,
      checkmarkOutline
    });
  }


  // initialize page
  ngOnInit(): void {
    this.updateClock();
    this.loadAttendance();

    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }


  // cleanup interval
  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }


  // update live clock
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


  // attendance status label
  get attendanceStatus(): string {
    if (this.timeOut) {
      return 'Timed Out';
    }

    if (this.timeIn) {
      return 'Timed In';
    }

    return 'Not timed in';
  }


  // record time in
  recordTimeIn(): void {
    if (this.timeIn) return;

    const now = new Date();

    this.timeIn = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    this.saveAttendance();
    this.updateTodayLog();
  }


  // record time out
  recordTimeOut(): void {
    if (!this.timeIn || this.timeOut) return;

    const now = new Date();

    this.timeOut = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    this.saveAttendance();
    this.updateTodayLog();
  }


  // save attendance locally
  saveAttendance(): void {
    const record = {
      date: new Date().toLocaleDateString('en-CA'),
      timeIn: this.timeIn,
      timeOut: this.timeOut
    };

    localStorage.setItem(
      'interntrack_attendance_demo',
      JSON.stringify(record)
    );
  }


  // load saved attendance
  loadAttendance(): void {
    const saved = localStorage.getItem(
      'interntrack_attendance_demo'
    );

    if (!saved) return;

    try {
      const record = JSON.parse(saved);
      const today = new Date().toLocaleDateString('en-CA');

      if (record.date === today) {
        this.timeIn = record.timeIn || '';
        this.timeOut = record.timeOut || '';

        this.updateTodayLog();
      }
    } catch {
      // ignore invalid demo records
    }
  }


  // update today's recent log
  updateTodayLog(): void {
    if (!this.timeIn) return;

    const today = new Date();

    const dateLabel = today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const hoursLabel =
      `${this.timeIn} - ${this.timeOut || '--'}`;

    const todayLog: AttendanceLog = {
      id: 0,
      date: dateLabel,
      hours: hoursLabel,
      status: 'pending'
    };

    this.recentLogs = [
      todayLog,
      ...this.recentLogs.filter(log => log.id !== 0)
    ];
  }


  // retry synchronization
  retrySync(): void {
    this.syncMessage =
      'Server synchronization is not connected yet. ' +
      'Your demo attendance record is stored locally.';
  }

}