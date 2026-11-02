import { Component, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

// navigation item interface
interface SupervisorNavItem {
  label: string;
  path: string;
}

// supervisor layout
@Component({
  selector: 'app-supervisor-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './supervisor-layout.page.html',
  styleUrls: ['./supervisor-layout.page.scss'],
  host: {
    class: 'ion-page'
  }
})

export class SupervisorLayoutComponent {

  // router
  private readonly router = inject(Router);

  // sidebar state
  isSidebarOpen = false;

  // current page
  currentPageTitle = 'Dashboard & Quick Actions';

  // navigation items
  readonly navItems: SupervisorNavItem[] = [
    {
      label: 'Dashboard & Quick Actions',
      path: '/supervisor/dashboard'
    },
    {
      label: 'DTR & Attendance Verification',
      path: '/supervisor/attendance'
    },
    {
      label: 'Weekly Accomplishment Reports',
      path: '/supervisor/reports'
    },
    {
      label: 'Intern Evaluation & Rubric',
      path: '/supervisor/evaluation'
    },
    {
      label: 'Intern Roster & Progress',
      path: '/supervisor/interns'
    }
  ];

  // initialize routing
  constructor() {
    this.updatePageTitle(this.router.url);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        ),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        this.updatePageTitle(event.urlAfterRedirects);
        this.closeSidebar();
      });
  }

  // update page title
  private updatePageTitle(url: string): void {
    const path = url
      .split(/[?#]/)[0]
      .replace(/\/+$/, '');

    const activePage = this.navItems.find(
      item => item.path === path
    );

    this.currentPageTitle = activePage
      ? activePage.label
      : 'Supervisor Workspace';
  }

  // toggle sidebar
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // close sidebar
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

}