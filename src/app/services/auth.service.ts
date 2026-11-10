import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.getClient();
  private currentUser: User | null = null;
  private userRole: string | null = null;

  constructor(private router: Router) {
    // Check for existing session on initialization
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = session.user;
      await this.loadUserRole(session.user.id);
    }

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = session.user;
        await this.loadUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.userRole = null;
        localStorage.clear();
      }
    });
  }

  private async loadUserRole(userId: string): Promise<void> {
    try {
      // Load role from users table (old schema)
      const { data, error } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (data) {
        this.userRole = data.role;
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        this.currentUser = data.user;
        await this.loadUserRole(data.user.id);

        // Store user role in localStorage for easy access
        if (this.userRole) {
          localStorage.setItem('userRole', this.userRole);
        }

        // Store student ID from users table for later use
        await this.loadStudentIdFromUsers(data.user.id);

        // Redirect based on role
        this.redirectBasedOnRole();
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  private async loadStudentIdFromUsers(userId: string): Promise<void> {
    try {
      // Load student ID from users table (old schema)
      const { data, error } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('id', userId)
        .single();

      if (data && data.user_id) {
        localStorage.setItem('studentId', data.user_id);
      }
    } catch (error) {
      console.error('Error loading student ID:', error);
    }
  }

  // Student ID login via Edge Function (secure, no email exposure)
  async signInWithStudentId(studentId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseUrl = 'https://itteqwekmszlssyordpf.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dGVxd2VrbXN6bHNzeW9yZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjI4MDgsImV4cCI6MjEwOTA5ODgwOH0.0MAGcWgabDQTO3NsOazbCTIDSSku5GHfcdGBYDJ3Ft4';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/student-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          student_id: studentId,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      // Set the session from the Edge Function response
      const { data: sessionData, error: sessionError } = await this.supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });

      if (sessionError || !sessionData.session) {
        return { success: false, error: 'Failed to establish session' };
      }

      this.currentUser = sessionData.session.user;
      await this.loadUserRole(sessionData.session.user.id);

      // Store user role in localStorage for easy access
      if (this.userRole) {
        localStorage.setItem('userRole', this.userRole);
      }

      // Store student ID from users table for later use
      await this.loadStudentIdFromUsers(sessionData.session.user.id);

      // Redirect based on role
      this.redirectBasedOnRole();

      return { success: true };
    } catch (error: any) {
      console.error('Student ID login error:', error);
      return { success: false, error: 'Invalid credentials' };
    }
  }

  // Get student ID from current session
  getStudentId(): string | null {
    return localStorage.getItem('studentId');
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser = null;
    this.userRole = null;
    localStorage.clear();
    await this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserRole(): string | null {
    return this.userRole || localStorage.getItem('userRole');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isStudent(): boolean {
    return this.userRole === 'student_intern';
  }

  isSupervisor(): boolean {
    return this.userRole === 'company_supervisor';
  }

  isCoordinator(): boolean {
    return this.userRole === 'ojt_coordinator';
  }

  redirectBasedOnRole(): void {
    switch (this.userRole) {
      case 'student_intern':
        this.router.navigate(['/tabs/home']);
        break;
      case 'company_supervisor':
        this.router.navigate(['/supervisor/dashboard']);
        break;
      case 'ojt_coordinator':
        this.router.navigate(['/coordinator/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
