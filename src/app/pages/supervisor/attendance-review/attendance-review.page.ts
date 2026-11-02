import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-attendance-review',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './attendance-review.page.html',
  styleUrls: ['./attendance-review.page.scss'],
})
export class AttendanceReviewPage {

  constructor() {
    addIcons({
      cameraOutline,
    });
  }

  // selected intern
  selectedInternId = '24-3312-IT';

  // intern list
  interns = [
    {
      id: '24-3312-IT',
      name: 'Kyllie Rose S. Balonsong',
      department: 'Cloud Applications & QA Division',
      totalRendered: 272,
      totalVerified: 272,
    },
    {
      id: '24-3313-IT',
      name: 'Juan Carlos Miguel San Diego',
      department: 'Full Stack Web Engineering',
      totalRendered: 264,
      totalVerified: 256,
    },
    {
      id: '24-3314-IT',
      name: 'Alexander A. Bernabe',
      department: 'AI/ML Integration',
      totalRendered: 280,
      totalVerified: 272,
    },
    {
      id: '24-3315-IT',
      name: 'Jan Ronelle B. Roche',
      department: 'DevOps & Cloud Infrastructure',
      totalRendered: 256,
      totalVerified: 248,
    },
  ];

  // attendance records
  attendanceRecords = [
    {
      id: 1,
      internId: '24-3312-IT',
      date: '10-27-26',
      day: 'TUE',
      timeIn: '08:02 AM',
      timeOut: 'Active',
      hours: '--',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'PROVISIONAL',
      action: 'Active',
    },
    {
      id: 2,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'PROVISIONAL',
      action: 'VERIFY',
    },
    {
      id: 3,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
    {
      id: 4,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
    {
      id: 5,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
    {
      id: 6,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
    {
      id: 7,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
    {
      id: 8,
      internId: '24-3312-IT',
      date: '10-26-26',
      day: 'TUE',
      timeIn: '07:58 AM',
      timeOut: '05:04 PM',
      hours: '8.0h',
      photo: true,
      location: 'Accenture, Station 4b',
      status: 'VERIFIED',
      action: 'Signed',
    },
  ];

  // selected intern details
  get selectedIntern() {
    return this.interns.find(
      (intern) => intern.id === this.selectedInternId
    );
  }

  // filtered attendance records
  get filteredAttendance() {
    return this.attendanceRecords.filter(
      (record) => record.internId === this.selectedInternId
    );
  }

  // select intern
  selectIntern(internId: string): void {
    this.selectedInternId = internId;
  }

  // verify attendance
  verifyAttendance(recordId: number): void {
    const record = this.attendanceRecords.find(
      (item) => item.id === recordId
    );

    if (record && record.status === 'PROVISIONAL') {
      record.status = 'VERIFIED';
      record.action = 'Signed';
    }
  }

}
