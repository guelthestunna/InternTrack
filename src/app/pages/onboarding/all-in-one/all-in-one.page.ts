import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

// all in one page
@Component({
  selector: 'app-all-in-one',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ],
  templateUrl: './all-in-one.page.html',
  styleUrls: ['./all-in-one.page.scss']
})
export class AllInOnePage {

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

  // navigate to login
  next(): void {
    if (this.isLeaving) return;

    this.isLeaving = true;

    setTimeout(() => {
      this.navCtrl.navigateForward('/login', {
        animated: false
      });
    }, 300);
  }
}