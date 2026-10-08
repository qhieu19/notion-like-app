// main.js - Supabase initialization + demo mode toggle
const SUPABASE_URL = import.meta?.env?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta?.env?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Load Supabase client dynamically
async function initSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Demo mode: shows mock data instead of database calls
let isDemo = false;
window.isDemo = () => isDemo;

function toggleDemo() {
  isDemo = !isDemo;
  console.log('Demo mode:', isDemo ? 'ON' : 'OFF');
}
