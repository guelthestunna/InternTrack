import { Component } from '@angular/core';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';

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
export class ProfilePage {

  // student information
  student = {
    name: 'Ruffa Monis',
    initials: 'RM',
    studentId: '2#-#####',
    program: 'BS Information Technology',
    university: 'Pamantasan ng Lungsod ng Valenzuela'
  };

  // ojt placement
  placementDetails: PlacementDetail[] = [
    {
      label: 'Company',
      value: 'Accenture plc'
    },
    {
      label: 'Department',
      value: 'IT - QA Team'
    },
    {
      label: 'Start Date',
      value: 'August 31, 2026'
    },
    {
      label: 'Required Hours',
      value: '486 hrs'
    }
  ];

  // contacts
  contacts: ContactPerson[] = [
    {
      id: 1,
      name: 'Engr. Roberto Quinto',
      initials: 'RG',
      role: 'Company Supervisor'
    },
    {
      id: 2,
      name: 'Prof. Leng Alejandro',
      initials: 'LA',
      role: 'OJT Coordinator'
    }
  ];

  // register icons
  constructor(private alertController: AlertController) {
    addIcons({ mailOutline });
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