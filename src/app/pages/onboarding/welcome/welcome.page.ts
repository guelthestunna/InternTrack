import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

// welcome onboarding page
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss']
})
export class WelcomePage {

  // navigation
  private readonly navCtrl = inject(NavController);

  // animation state
  isLeaving = false;

  // register icons
  constructor() {
    addIcons({ arrowForwardOutline });
  }

  // reset animation
  ionViewWillEnter(): void {
    this.isLeaving = false;
  }

  // navigate to next onboarding page
  next(): void {
    if (this.isLeaving) return;

    this.isLeaving = true;

    setTimeout(() => {
      this.navCtrl.navigateForward('/onboarding/hours', {
        animated: false
      });
    }, 300);
  }
}