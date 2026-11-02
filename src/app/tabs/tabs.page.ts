import { Component, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline,home, timeOutline, time, calendarClearOutline, calendarClear, folderOutline, folder, personOutline, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [ IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, ],
})
export class TabsPage {
  constructor() {
    addIcons({
      homeOutline, home,  timeOutline, time, calendarClearOutline, calendarClear, folderOutline, folder, personOutline, person
    })
  }
}
