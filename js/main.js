// main.js - Supabase initialization
const SUPABASE_URL = 'https://jiylcwtvzqvteqsrgcnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeWxjd3R2enF2dGVxc3JnY250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjgwOTgsImV4cCI6MjEwNzA0NDA5OH0.WRmzXzpKN1ctIbSvYfU-Q3ucXwDQl0wJYRPoaSNJ7XA';

// Load Supabase client dynamically
export async function initSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Toast notification system
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
