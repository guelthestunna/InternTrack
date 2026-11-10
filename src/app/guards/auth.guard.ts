import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if authenticated via Supabase Auth OR legacy student login (localStorage)
  const isAuth = authService.isAuthenticated() || localStorage.getItem('studentId');

  if (!isAuth) {
    router.navigate(['/login']);
    return false;
  }

  // Check role-based access
  const url = state.url;
  const userRole = authService.getUserRole() || localStorage.getItem('userRole');

  // Student routes
  if (url.startsWith('/tabs')) {
    if (userRole !== 'student_intern') {
      router.navigate(['/login']);
      return false;
    }
  }

  // Supervisor routes
  if (url.startsWith('/supervisor')) {
    if (userRole !== 'company_supervisor') {
      router.navigate(['/login']);
      return false;
    }
  }

  // Coordinator routes
  if (url.startsWith('/coordinator')) {
    if (userRole !== 'ojt_coordinator') {
      router.navigate(['/login']);
      return false;
    }
  }

  return true;
};
