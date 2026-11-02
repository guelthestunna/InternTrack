import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  businessOutline,
  cameraOutline,
  documentTextOutline,
  chevronForwardOutline,
  timeOutline,
  checkmarkOutline,
  alertCircleOutline
} from 'ionicons/icons';

// homepage
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ],
  templateUrl: './homepage.page.html',
  styleUrls: ['./homepage.page.scss']
})
export class HomepagePage {

  // student information
  studentName = 'Ruffa Monis';
  companyLocation = 'Accenture plc, Mandaluyong, Metro Manila';

  // ojt hours
  requiredHours = 486;
  verifiedHours = 196.0;
  provisionalHours = 16.5;

  // total completed hours
  get totalHours(): number {
    return this.verifiedHours + this.provisionalHours;
  }

  // remaining hours
  get remainingHours(): number {
    return Math.max(0, this.requiredHours - this.totalHours);
  }

  // verified progress
  get verifiedPercent(): number {
    return (this.verifiedHours / this.requiredHours) * 100;
  }

  // provisional progress
  get provisionalPercent(): number {
    return (this.provisionalHours / this.requiredHours) * 100;
  }

  // recent activities
  showAllActivities = false;

  activities = [
    {
      id: 1,
      icon: 'time-outline',
      description: 'Timed Out at 5:06 PM',
      day: 'Tue'
    },
    {
      id: 2,
      icon: 'checkmark-outline',
      description: 'Week 8 Report Approved',
      day: 'Mon'
    },
    {
      id: 3,
      icon: 'alert-circle-outline',
      description: 'Week 7 Report Returned',
      day: 'Fri'
    },
    {
      id: 4,
      icon: 'time-outline',
      description: 'Timed In at 8:04 AM',
      day: 'Thu'
    },
    {
      id: 5,
      icon: 'checkmark-outline',
      description: 'Week 6 Report Approved',
      day: 'Wed'
    }
  ];

  // displayed activities
  get displayedActivities() {
    return this.showAllActivities
      ? this.activities
      : this.activities.slice(0, 3);
  }

  // toggle activities
  toggleActivities(): void {
    this.showAllActivities = !this.showAllActivities;
  }

  // register icons
  constructor() {
    addIcons({
      businessOutline,
      cameraOutline,
      documentTextOutline,
      chevronForwardOutline,
      timeOutline,
      checkmarkOutline,
      alertCircleOutline
    });
  }
}