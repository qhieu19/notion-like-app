// notes.js - Handle notes CRUD operations
import { initSupabase } from './main.js';

let supabase;
let isDemo = false;
let notes = []; // Cache for demo mode

async function init() {
  if (window.isDemo()) {
    isDemo = true;
    console.log('Notes: demo mode');
    // Load mock notes
    notes = JSON.parse(localStorage.getItem('demo-notes') || '[]');
    renderNotes();
    setupForm();
  } else {
    supabase = await initSupabase();
    fetchNotes();
    setupForm();
  }
}

// Fetch notes from Supabase
async function fetchNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching notes:', error);
    showError('Failed to load notes');
  } else {
    notes = data;
    renderNotes();
  }
}

// Render notes list
function renderNotes() {
  const container = document.getElementById('notes-list');
  if (notes.length === 0) {
    container.innerHTML = '<p class="empty-state">No notes yet. Click "+ New Note" to create one.</p>';
    return;
  }
  container.innerHTML = notes.map(note => `
    <div class="note-card" data-id="${note.id}">
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content).substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
      <small>${new Date(note.updated_at).toLocaleString()}</small>
    </div>
  `).join('');
}

// Setup form submit and cancel
function setupForm() {
  const modal = document.getElementById('note-modal');
  const form = document.getElementById('note-form');
  const cancelBtn = document.getElementById('cancel-note');
  const newNoteBtn = document.getElementById('new-note-btn');

  newNoteBtn.onclick = () => {
    form.reset();
    modal.style.display = 'block';
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) return;

    if (isDemo) {
      const newNote = {
        id: Date.now().toString(),
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      notes.unshift(newNote);
      localStorage.setItem('demo-notes', JSON.stringify(notes));
      renderNotes();
    } else {
      const { error } = await supabase
        .from('notes')
        .insert([{ title, content }]);
      if (error) {
        console.error('Error inserting note:', error);
        showError('Failed to save note');
      } else {
        await fetchNotes();
      }
    }
    modal.style.display = 'none';
  };

  // Close modal when clicking outside
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Utility: escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility: show error message
function showError(msg) {
  alert(msg); // Simple for now; could be improved
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);