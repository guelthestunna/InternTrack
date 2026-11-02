import { Component } from '@angular/core';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  addOutline,
  createOutline,
  checkmarkOutline,
  arrowUndoOutline,
  chevronForwardOutline
} from 'ionicons/icons';

// report interfaces
type ReportStatus = 'draft' | 'approved' | 'returned';

interface WeeklyReport {
  id: number;
  week: number;
  period: string;
  status: ReportStatus;
  editedLabel?: string;
  accomplishments?: string;
  commentCount?: number;
  feedback?: string;
}

// reports page
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    IonContent,
    IonIcon
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss']
})
export class ReportsPage {

  // local storage
  private storageKey = 'interntrack_reports_demo';

  // current week report
  currentReport: WeeklyReport = {
    id: 9,
    week: 9,
    period: 'Oct 26 - 30',
    status: 'draft',
    editedLabel: 'Edited today at 7:40 AM',
    accomplishments: ''
  };

  // previous reports
  previousReports: WeeklyReport[] = [
    {
      id: 8,
      week: 8,
      period: 'Oct 19 - 23',
      status: 'approved',
      accomplishments:
        'Completed assigned tasks and assisted the IT department.'
    },
    {
      id: 7,
      week: 7,
      period: 'Oct 12 - 16',
      status: 'returned',
      commentCount: 1,
      accomplishments:
        'Assisted with troubleshooting and technical support.',
      feedback:
        'Please provide additional details about the tasks you completed.'
    },
    {
      id: 6,
      week: 6,
      period: 'Oct 5 - 9',
      status: 'approved',
      accomplishments:
        'Assisted the IT department with daily technical activities.'
    },
    {
      id: 5,
      week: 5,
      period: 'Sep 28 - Oct 2',
      status: 'approved',
      accomplishments:
        'Completed weekly tasks and submitted the required report.'
    }
  ];

  // register icons
  constructor(private alertController: AlertController) {
    addIcons({
      addOutline,
      createOutline,
      checkmarkOutline,
      arrowUndoOutline,
      chevronForwardOutline
    });
  }

  // load reports
  ionViewWillEnter(): void {
    this.loadReports();
  }

  // report status label
  getStatusLabel(status: ReportStatus): string {
    switch (status) {
      case 'approved':
        return 'Approved';

      case 'returned':
        return 'Returned';

      case 'draft':
        return 'Draft';
    }
  }

  // report status icon
  getStatusIcon(status: ReportStatus): string {
    switch (status) {
      case 'approved':
        return 'checkmark-outline';

      case 'returned':
        return 'arrow-undo-outline';

      case 'draft':
        return 'create-outline';
    }
  }

  // create new report
  async createReport(): Promise<void> {
    const allWeeks = [
      this.currentReport.week,
      ...this.previousReports.map(report => report.week)
    ];

    const nextWeek = Math.max(...allWeeks) + 1;

    const alert = await this.alertController.create({
      header: 'Create Weekly Report',
      subHeader: 'New Report Draft',
      message: 'Enter the details of your new weekly report.',

      inputs: [
        {
          name: 'week',
          type: 'number',
          placeholder: 'Week number',
          value: nextWeek
        },
        {
          name: 'period',
          type: 'text',
          placeholder: 'Date range (e.g. Nov 2 - 6)'
        }
      ],

      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create Draft',
          handler: data => {
            const week = Number(data.week);
            const period = String(data.period || '').trim();

            if (!Number.isInteger(week) || week < 1 || !period) {
              return false;
            }

            // keep previous draft
            this.previousReports = [
              { ...this.currentReport },
              ...this.previousReports
            ];

            // create current draft
            this.currentReport = {
              id: Date.now(),
              week,
              period,
              status: 'draft',
              editedLabel: 'Created just now',
              accomplishments: ''
            };

            this.saveReports();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // edit current report
  async editCurrentReport(): Promise<void> {
    const alert = await this.alertController.create({
      header: `Week ${this.currentReport.week} Report`,
      subHeader: 'Edit Weekly Accomplishments',
      message:
        'Write the tasks and accomplishments completed during your internship.',

      inputs: [
        {
          name: 'accomplishments',
          type: 'textarea',
          placeholder: 'Enter your accomplishments...',
          value: this.currentReport.accomplishments || ''
        }
      ],

      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save Draft',
          handler: data => {
            this.currentReport = {
              ...this.currentReport,
              accomplishments: String(
                data.accomplishments || ''
              ).trim(),
              editedLabel: 'Edited just now'
            };

            this.saveReports();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // view previous report
  async openReport(report: WeeklyReport): Promise<void> {
    const status = this.getStatusLabel(report.status);

    const accomplishments = this.escapeHtml(
      report.accomplishments || 'No accomplishments recorded.'
    ).replace(/\n/g, '<br>');

    const feedback = report.feedback
      ? `<br><br><strong>Supervisor Feedback:</strong><br>` +
        this.escapeHtml(report.feedback)
      : '';

    const alert = await this.alertController.create({
      header: `Week ${report.week} Report`,
      subHeader: report.period,
      message:
        `<strong>Status:</strong> ${status}` +
        `<br><br>` +
        `<strong>Accomplishments:</strong><br>` +
        accomplishments +
        feedback,
      buttons: ['Close']
    });

    await alert.present();
  }

  // escape html content
  private escapeHtml(value: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return value.replace(
      /[&<>"']/g,
      character => entities[character]
    );
  }

  // save reports locally
  private saveReports(): void {
    const data = {
      currentReport: this.currentReport,
      previousReports: this.previousReports
    };

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(data)
    );
  }

  // load saved reports
  private loadReports(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      if (
        data.currentReport &&
        typeof data.currentReport.week === 'number' &&
        Array.isArray(data.previousReports)
      ) {
        this.currentReport = data.currentReport;
        this.previousReports = data.previousReports;
      }
    } catch {
      console.warn('Unable to load saved demo reports.');
    }
  }
}