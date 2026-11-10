import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://itteqwekmszlssyordpf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dGVxd2VrbXN6bHNzeW9yZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjI4MDgsImV4cCI6MjEwOTA5ODgwOH0.0MAGcWgabDQTO3NsOazbCTIDSSku5GHfcdGBYDJ3Ft4'
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
