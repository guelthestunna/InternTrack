import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, lockClosedOutline, eyeOutline, eyeOffOutline, chevronDownOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

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
  studentIdOrEmail = '';
  password = '';
  selectedRole = 'student_intern';

  // form state
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  // register icons
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly authService = inject(AuthService);

  constructor() {
    addIcons({personCircleOutline,chevronDownOutline,lockClosedOutline,eyeOutline,eyeOffOutline});
  }

  // toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // login
  async login(): Promise<void> {
    if (!this.studentIdOrEmail.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your credentials.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    console.log('Login attempt - Role:', this.selectedRole);
    console.log('Login attempt - Student ID/Email:', this.studentIdOrEmail.trim());

    try {
      let result: { success: boolean; error?: string };

      // If student role, use secure student ID login via Edge Function
      if (this.selectedRole === 'student_intern') {
        result = await this.authService.signInWithStudentId(
          this.studentIdOrEmail.trim(),
          this.password
        );
      } else {
        // For supervisors/coordinators, use email/password directly
        result = await this.authService.signIn(
          this.studentIdOrEmail.trim(),
          this.password
        );
      }

      console.log('Login result:', result);

      if (!result.success) {
        this.errorMessage = result.error || 'Login failed. Please try again.';
        this.isLoading = false;
      }
      // If successful, auth service will redirect based on role
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      this.isLoading = false;
    }
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