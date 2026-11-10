import { Component, type OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, AlertController, type ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, logOutOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

// contact interface
interface ContactPerson {
  id: number;
  name: string;
  initials: string;
  role: string;
  email?: string;
}

// placement interface
interface PlacementDetail {
  label: string;
  value: string;
}

// profile page
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonContent,
    IonIcon
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements ViewWillEnter, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private supabase = this.supabaseService.getClient();
  private destroyed = false;

  // student information
  student = {
    name: '',
    initials: '',
    studentId: '',
    program: '',
    university: ''
  };

  // ojt placement
  placementDetails: PlacementDetail[] = [];

  // contacts
  contacts: ContactPerson[] = [];

  private currentStudentId = '';

  // register icons
  constructor() {
    addIcons({mailOutline,logOutOutline});
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private refresh(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }

  // logout
  async logout(): Promise<void> {
    await this.authService.signOut();
  }

  async ionViewWillEnter(): Promise<void> {
    // Resolve student ID consistently
    const id =
      this.route.snapshot.queryParamMap.get('studentId') ||
      this.authService.getStudentId() ||
      localStorage.getItem('studentId');

    if (!id) {
      console.error('Profile: no student ID found. The login flow did not store it.');
      this.resetState();
      this.refresh();
      return;
    }

    this.currentStudentId = id;
    await this.loadProfileData();
  }

  private resetState(): void {
    this.student = {
      name: '',
      initials: '',
      studentId: '',
      program: '',
      university: ''
    };
    this.placementDetails = [];
    this.contacts = [];
  }

  async loadProfileData(): Promise<void> {
    console.log('Profile: loading data for student ID:', this.currentStudentId);
    try {
      // Load student data from students table
      const { data: studentData, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('student_id', this.currentStudentId)
        .maybeSingle();

      if (error) {
        console.error('Profile: student query failed:', error);
        this.resetState();
        return;
      }

      if (!studentData) {
        console.log('Profile: no student data found for ID:', this.currentStudentId);
        this.resetState();
        return;
      }

      // Populate student info
      this.student.name = studentData.full_name || 'Unknown';
      this.student.studentId = studentData.student_id || 'N/A';
      this.student.program = studentData.course || 'N/A';
      this.student.university = studentData.school_name || 'Pamantasan ng Lungsod ng Valenzuela';

      // Generate initials from name
      const nameParts = this.student.name.split(' ');
      this.student.initials = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : (nameParts[0]?.substring(0, 2).toUpperCase() || '??');

      this.refresh();

      // Load placement details
      this.placementDetails = [
        {
          label: 'Company',
          value: studentData.company_name || studentData.company_location || 'Not assigned'
        },
        {
          label: 'Department',
          value: studentData.department || 'Not specified'
        },
        {
          label: 'Start Date',
          value: studentData.ojt_start_date
            ? new Date(studentData.ojt_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Not set'
        },
        {
          label: 'Required Hours',
          value: `${studentData.required_hours || 0} hrs`
        }
      ];

      // Load contacts (only if data exists)
      this.contacts = [];
      if (studentData.supervisor_name) {
        this.contacts.push({
          id: 1,
          name: studentData.supervisor_name,
          initials: this.generateInitials(studentData.supervisor_name),
          role: 'Company Supervisor',
          email: studentData.supervisor_email
        });
      }
      if (studentData.coordinator_name) {
        this.contacts.push({
          id: 2,
          name: studentData.coordinator_name,
          initials: this.generateInitials(studentData.coordinator_name),
          role: 'OJT Coordinator',
          email: studentData.coordinator_email
        });
      }

      this.refresh();
    } catch (error) {
      console.error('Profile: loadProfileData error:', error);
      this.resetState();
      this.refresh();
    }
  }

  private generateInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // email contact
  async emailContact(contact: ContactPerson): Promise<void> {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
      return;
    }

    const alert = await this.alertController.create({
      header: 'Contact Information',
      message: `The email address for ${contact.name} has not been added yet.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
