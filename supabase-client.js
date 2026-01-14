
// Supabase Configuration
const SUPABASE_URL = 'https://yehwcgqjauxmyqcystqr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaHdjZ3FqYXV4bXlxY3lzdHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjU2ODAsImV4cCI6MjA4MzkwMTY4MH0.ZGe_xi5_rSX-AdeGcGArfv0oFQ8OX2GotXiKLjClMv8';

// Initialize Supabase Client
// The CDN exposes a global 'supabase' object (The Library). 
// We want to replace it (or alias it) with the 'Client' instance so code like supabase.from() works.

function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        // Library is loaded. Create client.
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // OVERWRITE global 'supabase' with the actual client 
        // preventing "supabase.from is not a function" error
        window.supabase = client;

        console.log("Supabase Client successfully initialized and attached to window.supabase");
        return true;
    }
    return false;
}

// Attempt init immediately
if (!initSupabase()) {
    // If failed (script loading delay), try again on window load
    window.addEventListener('load', () => {
        if (!initSupabase()) {
            console.error("CRITICAL: Supabase SDK could not be loaded.");
            alert("Database Error: Supabase SDK failed to load. Please refresh the page.");
        }
    });
}
