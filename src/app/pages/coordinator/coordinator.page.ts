import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-coordinator',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon],
  templateUrl: './coordinator.page.html',
  styleUrls: ['./coordinator.page.scss']
})
export class CoordinatorPage {
  constructor(private authService: AuthService) {
    addIcons({ logOutOutline });
  }

  logout(): void {
    this.authService.signOut();
  }
}
