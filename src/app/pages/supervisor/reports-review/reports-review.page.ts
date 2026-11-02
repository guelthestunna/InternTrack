import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reports-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-review.page.html',
  styleUrls: ['./reports-review.page.scss'],
})
export class ReportsReviewPage {

  selectedInternId = '24-3312-IT';
  selectedWeek = 'Week 6';

  interns = [
    {
      id: '24-3312-IT',
      name: 'Kyllie Rose S. Balonsong',
      initials: 'KB',
      department: 'Cloud Applications & QA Division',
    },
    {
      id: '24-3313-IT',
      name: 'Juan Carlos Miguel San Diego',
      initials: 'JSD',
      department: 'Full Stack Web Engineering',
    },
    {
      id: '24-3314-IT',
      name: 'Alexander A. Bernabe',
      initials: 'AB',
      department: 'AI/ML Integration',
    },
    {
      id: '24-3315-IT',
      name: 'Jan Ronelle B. Roche',
      initials: 'JR',
      department: 'DevOps & Cloud Infrastructure',
    },
  ];

  weeks = [
    'Week 6',
    'Week 5',
    'Week 4',
    'Week 3',
    'Week 2',
    'Week 1',
  ];

  report = {
    weekLabel: 'Week 7 · Oct 19–23, 2026',
    submittedDate: 'Submitted Oct 26',
    hoursLogged: '40.0h',
    daysPresent: '5 / 5 days',
    dtrStatus: 'Synced',
    activities:
      'Completed the dashboard QA checklist and documented accessibility issues for the client portal. Joined the sprint planning session and prepared test cases for the next release.',
    reflection:
      'This week helped me connect the testing process to real user needs. I learned how to report issues with clearer reproduction steps.',
    status: 'Pending for review',
  };

  reviewComment = '';

  get selectedIntern() {
    return this.interns.find(
      intern => intern.id === this.selectedInternId
    );
  }

  selectIntern(internId: string) {
    this.selectedInternId = internId;
    this.reviewComment = '';
    this.report.status = 'Pending for review';
  }

  selectWeek(week: string) {
    this.selectedWeek = week;
  }

  onCommentChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.reviewComment = textarea.value;
  }

  approveReport() {
    this.report.status = 'Approved';
  }

  returnReport() {
    this.report.status = 'Returned';
  }

}
