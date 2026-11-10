import { CommonModule } from '@angular/common';
import { type OnInit, type OnDestroy, ChangeDetectorRef, Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { type ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  cameraOutline,
  documentTextOutline,
  homeOutline,
  timeOutline,
  calendarClearOutline,
  folderOutline,
  personOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.page.html',
  styleUrls: ['./homepage.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomepagePage implements OnInit, OnDestroy, ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private supabase = this.supabaseService.getClient();

  // Student Profile Data (no hardcoded defaults, so failures are visible)
  studentName = '';
  studentCourse = '';
  studentIdNumber = '';
  companyLocation = '';

  // Hours & Progress Metrics
  totalHours = 0;
  requiredHours = 486;
  verifiedHours = 0;
  provisionalHours = 0;
  remainingHours = 486;
  verifiedPercent = 0;
  provisionalPercent = 0;

  // Today's Attendance Dynamic Card State
  todayStatusText = 'Not timed in yet';
  isTimedInToday = false;
  currentLiveTime = '';
  private clockInterval?: ReturnType<typeof setInterval>;

  // Activities & Toggles
  showAllActivities = false;
  activities: any[] = [];
  displayedActivities: any[] = [];

  // Report Data
  currentReportWeek = 0;
  currentReportPeriod = '';
  currentReportStatus = '';

  constructor() {
    addIcons({
      businessOutline,
      cameraOutline,
      documentTextOutline,
      chevronForwardOutline,
      homeOutline,
      timeOutline,
      calendarClearOutline,
      folderOutline,
      personOutline
    });
  }

  ngOnInit(): void {
    this.updateLiveTime();
    this.clockInterval = setInterval(() => {
      this.updateLiveTime();
      this.cdr.detectChanges();
    }, 1000);
  }

  // Data loads here (runs on first entry and every return to the page)
  async ionViewWillEnter(): Promise<void> {
    // Get student ID from auth service (which reads from users table)
    const id = this.authService.getStudentId() || this.route.snapshot.queryParamMap.get('studentId');

    if (!id) {
      console.error('Homepage: no student ID found. User not logged in.');
      this.studentName = 'Unknown student';
      this.cdr.detectChanges();
      return;
    }

    this.studentIdNumber = id;

    await this.loadStudentData(id);
    await this.loadCurrentReport(id);

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateLiveTime(): void {
    this.currentLiveTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  async loadStudentData(studentId: string): Promise<void> {
    console.log('Homepage: Loading data for student ID:', studentId);

    try {
      const { data, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) {
        console.error('Homepage: student query failed:', error);
      }

      console.log('Homepage: Student data:', data);

      if (data) {
        this.studentName = data.full_name || data.name || 'Unknown';
        this.studentCourse = data.course || '';
        this.companyLocation = data.company_location || '';
        console.log('Homepage: Updated student name to:', this.studentName);
      } else {
        this.studentName = 'Student not found';
        this.studentCourse = '';
        this.companyLocation = '';
      }

      this.cdr.detectChanges();

      // Fetch all attendance logs to calculate total hours dynamically matching DTR
      const { data: attData, error: attError } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (attError) {
        console.error('Homepage: attendance query failed:', attError);
      }

      if (attData && attData.length > 0) {
        let verifiedMinutes = 0;
        let provisionalMinutes = 0;

        // Check today's check-in status
        const todayStr = new Date().toDateString();
        const todayRecord = attData.find(
          row => row.created_at && new Date(row.created_at).toDateString() === todayStr
        );

        if (todayRecord) {
          if (todayRecord.time_in && !todayRecord.time_out) {
            this.todayStatusText = 'Timed In';
            this.isTimedInToday = true;
          } else if (todayRecord.time_in && todayRecord.time_out) {
            this.todayStatusText = 'Timed Out (Done for today)';
            this.isTimedInToday = true;
          }
        }

        attData.forEach(row => {
          if (row.time_in && row.time_out) {
            const diffMs = new Date(row.time_out).getTime() - new Date(row.time_in).getTime();
            if (diffMs > 0) {
              const minutes = Math.floor(diffMs / (1000 * 60));
              // Separate verified vs provisional based on verification_status
              if (row.verification_status === 'verified') {
                verifiedMinutes += minutes;
              } else {
                provisionalMinutes += minutes;
              }
            }
          }
        });

        const verifiedHours = parseFloat((verifiedMinutes / 60).toFixed(1));
        const provisionalHours = parseFloat((provisionalMinutes / 60).toFixed(1));
        const totalHours = verifiedHours + provisionalHours;

        this.verifiedHours = verifiedHours;
        this.provisionalHours = provisionalHours;
        this.totalHours = totalHours;
        this.remainingHours = Math.max(0, this.requiredHours - this.totalHours);
        this.verifiedPercent = Math.min(100, (this.verifiedHours / this.requiredHours) * 100);
        this.provisionalPercent = Math.min(100, (this.provisionalHours / this.requiredHours) * 100);

        // Map recent activities for display
        this.activities = attData.map((row, index) => {
          const formattedDate = row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })
            : 'Recent';
          const formattedIn = row.time_in
            ? new Date(row.time_in).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            : '--';
          const formattedOut = row.time_out
            ? new Date(row.time_out).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            : '--';

          return {
            id: index + 1,
            icon: 'time-outline',
            title: `Attendance: ${formattedDate}`,
            description: `Time In: ${formattedIn} | Time Out: ${formattedOut}`
          };
        });
      } else {
        // Reset so a previous student's numbers don't linger
        this.totalHours = 0;
        this.verifiedHours = 0;
        this.provisionalHours = 0;
        this.remainingHours = this.requiredHours;
        this.verifiedPercent = 0;
        this.provisionalPercent = 0;
        this.todayStatusText = 'Not timed in yet';
        this.isTimedInToday = false;
        this.activities = [];
      }

      this.updateDisplayedActivities();
    } catch (e) {
      console.error('Homepage: loadStudentData error:', e);
    }
  }

  toggleActivities(): void {
    this.showAllActivities = !this.showAllActivities;
    this.updateDisplayedActivities();
  }

  updateDisplayedActivities(): void {
    if (this.showAllActivities) {
      this.displayedActivities = [...this.activities];
    } else {
      this.displayedActivities = [];
    }
  }

  async loadCurrentReport(studentId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'draft')
        .order('week', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Homepage: report query failed:', error);
      }

      if (data) {
        this.currentReportWeek = data.week;
        this.currentReportPeriod = data.period;
        this.currentReportStatus = data.status;
      } else {
        this.currentReportWeek = 0;
        this.currentReportPeriod = '';
        this.currentReportStatus = '';
      }
    } catch (e) {
      console.error('Homepage: loadCurrentReport error:', e);
    }
  }
}