import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

// hours onboarding page
@Component({
  selector: 'app-hours',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ],
  templateUrl: './hours.page.html',
  styleUrls: ['./hours.page.scss']
})
export class HoursPage {

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
      this.navCtrl.navigateForward('/onboarding/all-in-one', {
        animated: false
      });
    }, 300);
  }
}