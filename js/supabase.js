// Supabase configuration
const SUPABASE_URL = 'https://genaczujkqpnfbqjrjtk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbmFjenVqa3FwbmZicWpyanRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzIxMzIsImV4cCI6MjA4MjQ0ODEzMn0.uskAWU3pOqHR9RO90GywrFydDXFRmTKAHdo9lEjj3fMy';

// Initialize Supabase client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'Content-Type': 'application/json'
        }
    }
});

// Export supabase client for admin panel
export const supabase = window.supabaseClient;