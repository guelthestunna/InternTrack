import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  checkmarkOutline,
  arrowUndoOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';

// report interfaces
type ReportStatus = 'draft' | 'pending_review' | 'approved' | 'returned';

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

// empty placeholder for "no current draft"
const emptyReport = (): WeeklyReport => ({
  id: 0,
  week: 0,
  period: '',
  status: 'draft',
  editedLabel: '',
  accomplishments: ''
});

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
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);
  private readonly supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.getClient();

  studentId = '';

  // current week report
  currentReport: WeeklyReport = emptyReport();

  // previous reports
  previousReports: WeeklyReport[] = [];

  // register icons
  constructor() {
    addIcons({
      addOutline,
      createOutline,
      checkmarkOutline,
      arrowUndoOutline,
      chevronForwardOutline
    });
  }

  // load reports
  async ionViewWillEnter(): Promise<void> {
    const id =
      this.route.snapshot.queryParamMap.get('studentId') ||
      localStorage.getItem('studentId');

    if (!id) {
      console.error('Reports: no student ID found. The login flow did not store it.');
      this.currentReport = emptyReport();
      this.previousReports = [];
      this.cdr.detectChanges();
      return;
    }

    this.studentId = id;
    await this.loadReports();
  }

  // report status label
  getStatusLabel(status: ReportStatus): string {
    switch (status) {
      case 'approved':
        return 'Approved';

      case 'returned':
        return 'Returned';

      case 'pending_review':
        return 'Pending Review';

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

      case 'pending_review':
        return 'time-outline';

      case 'draft':
        return 'create-outline';
    }
  }

  // create new report
  async createReport(): Promise<void> {
    const allWeeks = [
      this.currentReport.week,
      ...this.previousReports.map(report => report.week)
    ].filter(w => w > 0);

    const nextWeek = allWeeks.length > 0 ? Math.max(...allWeeks) + 1 : 1;

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
          handler: async data => {
            const week = Number(data.week);
            const period = String(data.period || '').trim();

            if (!Number.isInteger(week) || week < 1 || !period) {
              return false;
            }

            // Save previous draft to Supabase if it exists
            if (this.currentReport.week > 0) {
              await this.saveReportToSupabase(this.currentReport);
            }

            // create current draft
            this.currentReport = {
              id: Date.now(),
              week,
              period,
              status: 'draft',
              editedLabel: 'Created just now',
              accomplishments: ''
            };

            await this.saveReportToSupabase(this.currentReport);
            await this.loadReports();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // submit current report for review
  async submitReport(): Promise<void> {
    if (!this.currentReport.week || this.currentReport.week === 0) {
      const alert = await this.alertController.create({
        header: 'No Report',
        message: 'Please create a report first.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.currentReport.status === 'pending_review' || this.currentReport.status === 'approved') {
      const alert = await this.alertController.create({
        header: 'Cannot Submit',
        message: `This report is already ${this.getStatusLabel(this.currentReport.status).toLowerCase()}.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Submit Report',
      message: 'Are you sure you want to submit this report for supervisor review?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit',
          handler: async () => {
            this.currentReport = {
              ...this.currentReport,
              status: 'pending_review',
              editedLabel: 'Submitted just now'
            };

            await this.saveReportToSupabase(this.currentReport);
            await this.loadReports();
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
          handler: async data => {
            this.currentReport = {
              ...this.currentReport,
              accomplishments: String(
                data.accomplishments || ''
              ).trim(),
              editedLabel: 'Edited just now'
            };

            await this.saveReportToSupabase(this.currentReport);
            await this.loadReports();
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

    const accomplishments = report.accomplishments || 'No accomplishments recorded.';

    let message = `Status: ${status}\n\nAccomplishments:\n${accomplishments}`;

    if (report.feedback) {
      message += `\n\nSupervisor Feedback:\n${report.feedback}`;
    }

    const alert = await this.alertController.create({
      header: `Week ${report.week} Report`,
      subHeader: report.period,
      message: message,
      buttons: ['Close']
    });

    await alert.present();
  }

  // save report to Supabase
  private async saveReportToSupabase(report: WeeklyReport): Promise<void> {
    try {
      // First check if report already exists
      const { data: existing, error: lookupError } = await this.supabase
        .from('reports')
        .select('id')
        .eq('student_id', this.studentId)
        .eq('week', report.week)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        // Update existing report
        const updateData: any = {
          period: report.period,
          status: report.status,
          accomplishments: report.accomplishments || '',
          feedback: report.feedback || '',
          comment_count: report.commentCount || 0
        };

        // Set submitted_at when submitting for review
        if (report.status === 'pending_review') {
          updateData.submitted_at = new Date().toISOString();
        }

        const { error } = await this.supabase
          .from('reports')
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new report
        const insertData: any = {
          student_id: this.studentId,
          week: report.week,
          period: report.period,
          status: report.status,
          accomplishments: report.accomplishments || '',
          feedback: report.feedback || '',
          comment_count: report.commentCount || 0
        };

        // Set submitted_at when submitting for review
        if (report.status === 'pending_review') {
          insertData.submitted_at = new Date().toISOString();
        }

        const { error } = await this.supabase
          .from('reports')
          .insert(insertData);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving report to Supabase:', err);
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to save report: ' + (err as any).message,
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  // load reports from Supabase
  private async loadReports(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('*')
        .eq('student_id', this.studentId)
        .order('week', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const reports: WeeklyReport[] = data.map(row => ({
          id: row.id,
          week: row.week,
          period: row.period,
          status: row.status as ReportStatus,
          accomplishments: row.accomplishments || '',
          feedback: row.feedback || '',
          commentCount: row.comment_count || 0,
          editedLabel: 'Edited recently'
        }));

        // Set current report (most recent draft, pending_review, or returned)
        const editableReport = reports.find(r => r.status === 'draft' || r.status === 'returned' || r.status === 'pending_review');
        if (editableReport) {
          this.currentReport = editableReport;
          this.previousReports = reports.filter(r => r.id !== editableReport.id);
        } else {
          this.currentReport = emptyReport();
          this.previousReports = reports;
        }
      } else {
        // No reports found, initialize empty
        this.currentReport = emptyReport();
        this.previousReports = [];
      }
    } catch (err) {
      console.error('Error loading reports from Supabase:', err);
    } finally {
      // Tell Angular to redraw, since the data arrived after the first render
      this.cdr.detectChanges();
    }
  }
}