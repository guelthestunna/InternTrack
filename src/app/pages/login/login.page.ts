import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  personCircleOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

// login page
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {

  // login credentials
  studentId = '';
  password = '';

  // form state
  showPassword = false;
  errorMessage = '';

  // register icons
  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      personCircleOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  // toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // login
  login(): void {
    if (!this.studentId.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your Student ID and password.';
      return;
    }

    this.errorMessage = '';

    // frontend demo only
    this.router.navigateByUrl('/tabs/home');
  }

  // forgot password
  async forgotPassword(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Forgot Password',
      message:
        'Password recovery will be available once authentication is connected.',
      buttons: ['OK']
    });

    await alert.present();
  }

  // legal information
  async openLegal(title: string): Promise<void> {
    const alert = await this.alertController.create({
      header: title,
      message:
        'This information will be available when the official application policies are finalized.',
      buttons: ['OK']
    });

    await alert.present();
  }
}