import { Routes } from '@angular/router';

export const routes: Routes = [

  // default route
  {
    path: '',
    redirectTo: 'onboarding/welcome',
    pathMatch: 'full'
  },


  // onboarding pages
  {
    path: 'onboarding/welcome',
    loadComponent: () =>
      import('./pages/onboarding/welcome/welcome.page')
        .then(m => m.WelcomePage)
  },
  {
    path: 'onboarding/hours',
    loadComponent: () =>
      import('./pages/onboarding/hours/hours.page')
        .then(m => m.HoursPage)
  },
  {
    path: 'onboarding/all-in-one',
    loadComponent: () =>
      import('./pages/onboarding/all-in-one/all-in-one.page')
        .then(m => m.AllInOnePage)
  },


  // authentication
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page')
        .then(m => m.LoginPage)
  },


  // student intern routes
  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.page')
        .then(m => m.TabsPage),

    children: [

      // default student page
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },

      // home
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/homepage/homepage.page')
            .then(m => m.HomepagePage)
      },

      // attendance
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/attendance/attendance.page')
            .then(m => m.AttendancePage)
      },

      // daily time record
      {
        path: 'dtr',
        loadComponent: () =>
          import('./pages/dtr/dtr.page')
            .then(m => m.DtrPage)
      },

      // weekly reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.page')
            .then(m => m.ReportsPage)
      },

      // profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page')
            .then(m => m.ProfilePage)
      }

    ]
  },


  // company supervisor routes
  {
    path: 'supervisor',
    loadComponent: () =>
      import('./supervisor-layout/supervisor-layout.page')
        .then(m => m.SupervisorLayoutComponent),

    children: [

      // default supervisor page
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/supervisor/dashboard/dashboard.page')
            .then(m => m.DashboardPage)
      },

      // attendance verification
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/supervisor/attendance-review/attendance-review.page')
            .then(m => m.AttendanceReviewPage)
      },

      // weekly accomplishment reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/supervisor/reports-review/reports-review.page')
            .then(m => m.ReportsReviewPage)
      },

      // intern evaluation
      {
        path: 'evaluation',
        loadComponent: () =>
          import('./pages/supervisor/evaluation/evaluation.page')
            .then(m => m.EvaluationPage)
      },

      // intern roster
      {
        path: 'interns',
        loadComponent: () =>
          import('./pages/supervisor/interns/interns.page')
            .then(m => m.InternsPage)
      }

    ]
  }

];