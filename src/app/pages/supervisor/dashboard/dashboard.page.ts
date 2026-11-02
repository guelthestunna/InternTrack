import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonIcon, CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {

  constructor() {
    addIcons({
      cameraOutline,
    });
  }

  // attendance date
  attendanceDate = 'October 28, 2026';

  // summary cards
  summaryCards = [
    {
      label: 'My Interns',
      value: '4',
      description: 'All Active',
    },
    {
      label: 'Reports to review',
      value: '3 Active',
      description: 'Miguel, Kyllie, and Alex are on-site',
      hasIndicator: true,
    },
    {
      label: 'Attendance this week',
      value: '94%',
      description: 'Across assigned interns',
    },
  ];

  // attendance list
  attendanceList = [
    {
      initials: 'KB',
      name: 'Kyllie Rose S. Balonsong',
      details: '24-3312-IT · Cloud Applications & QA Division',
      status: 'CLOCKED IN',
      time: '08:02 AM',
      hasPhoto: true,
    },
    {
      initials: 'JSD',
      name: 'Juan Carlos Miguel San Diego',
      details: '24-3313-IT · Full Stack Web Engineering',
      status: 'ABSENT',
      time: '',
      hasPhoto: false,
    },
    {
      initials: 'AB',
      name: 'Alexander A. Bernabe',
      details: '24-3314-IT · AI/ML Integration',
      status: 'CLOCKED IN',
      time: '08:02 AM',
      hasPhoto: true,
    },
    {
      initials: 'JR',
      name: 'Jan Ronelle B. Roche',
      details: '24-3315-IT · DevOps & Cloud Infrastructure',
      status: 'CLOCKED IN',
      time: '08:02 AM',
      hasPhoto: true,
    },
  ];

  // quick actions
  quickActions = [
    {
      title: 'Review Attendance',
      subtitle: '3 shifts pending',
      route: '/supervisor/attendance',
    },
    {
      title: 'Review Reports',
      subtitle: 'Week 6 submitted',
      route: '/supervisor/reports',
    },
    {
      title: 'Intern Roster',
      subtitle: 'Hours & completion status',
      route: '/supervisor/interns',
    },
  ];

}
