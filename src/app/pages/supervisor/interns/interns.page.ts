import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-interns',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interns.page.html',
  styleUrls: ['./interns.page.scss'],
})
export class InternsPage {

  // intern list
  interns = [
    {
      id: '24-3312',
      name: 'Kyllie Rose S. Balonsong',
      status: 'ON TRACK',
      statusClass: 'on-track',
      completedHours: 284,
      requiredHours: 486,
      progress: 58.4,
      division: 'Cloud Applications & QA Division',
      email: 'kyllierosebalonsong@plv.edu.ph',
      endDate: 'December 11, 2026',
    },
    {
      id: '24-3313',
      name: 'Juan Carlos Miguel San Diego',
      status: 'AT RISK',
      statusClass: 'at-risk',
      completedHours: 198,
      requiredHours: 486,
      progress: 40.7,
      division: 'Full Stack Web Engineering',
      email: 'juancarlosmiguelsandiego@plv.edu.ph',
      endDate: 'December 22, 2026',
    },
    {
      id: '24-3314',
      name: 'Alexander A. Bernabe',
      status: 'AHEAD',
      statusClass: 'ahead',
      completedHours: 320,
      requiredHours: 486,
      progress: 65.8,
      division: 'AI/ML Integration & Data Pipeline',
      email: 'alexanderbernabe@plv.edu.ph',
      endDate: 'November 28, 2026',
    },
    {
      id: '24-3315',
      name: 'Jan Ronelle A. Roche',
      status: 'ON TRACK',
      statusClass: 'on-track',
      completedHours: 272,
      requiredHours: 486,
      progress: 56.0,
      division: 'DevOps & Cloud Infrastructure',
      email: 'janronelleroche@plv.edu.ph',
      endDate: 'December 11, 2026',
    },
  ];

}
