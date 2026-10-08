// main.js - Supabase initialization + demo mode toggle
const SUPABASE_URL = import.meta?.env?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta?.env?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Load Supabase client dynamically
export async function initSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Demo mode: shows mock data instead of database calls
// Check localStorage on load
window.isDemo = () => localStorage.getItem('demo-mode') !== 'false';

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
