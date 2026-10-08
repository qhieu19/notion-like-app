// notes.js - Handle notes CRUD operations
import { initSupabase, showToast } from './main.js';

let supabase;
let notes = [];
let currentNote = null;
let searchQuery = '';

async function init() {
  supabase = await initSupabase();
  fetchNotes();
  setupForm();
  setupSearch();
}

// Fetch notes from Supabase
async function fetchNotes() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'block';

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (loading) loading.style.display = 'none';

  if (error) {
    console.error('Error fetching notes:', error);
    showToast('Failed to load notes', 'error');
  } else {
    notes = data;
    renderNotes();
  }
}

// Render notes list
function renderNotes() {
  const container = document.getElementById('notes-list');

  // Filter notes based on search
  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  if (filteredNotes.length === 0) {
    container.innerHTML = searchQuery
      ? '<p class="empty-state">No notes match your search.</p>'
      : '<p class="empty-state">No notes yet. Click "+ New Note" to create one.</p>';
    return;
  }

  container.innerHTML = filteredNotes.map(note => `
    <div class="note-card" data-id="${note.id}">
      <div class="note-card-content">
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.content).substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
        <small>${new Date(note.updated_at).toLocaleString()}</small>
      </div>
      <div class="note-actions">
        <button class="btn-icon edit-note" data-id="${note.id}" title="Edit">✏️</button>
        <button class="btn-icon delete-note" data-id="${note.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.note-card-content').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = e.currentTarget.parentElement.dataset.id;
      showNoteDetail(id);
    });
  });

  document.querySelectorAll('.edit-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editNote(e.target.dataset.id);
    });
  });

  document.querySelectorAll('.delete-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(e.target.dataset.id);
    });
  });
}

// Setup form submit and cancel
function setupForm() {
  const modal = document.getElementById('note-modal');
  const form = document.getElementById('note-form');
  const cancelBtn = document.getElementById('cancel-note');
  const newNoteBtn = document.getElementById('new-note-btn');
  const modalTitle = modal.querySelector('h2');

  newNoteBtn.onclick = () => {
    currentNote = null;
    form.reset();
    modalTitle.textContent = 'New Note';
    modal.style.display = 'flex';
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
    currentNote = null;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) return;

    if (currentNote) {
      // Update existing note
      const { error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', currentNote);
      if (error) {
        console.error('Error updating note:', error);
        showToast('Failed to update note', 'error');
      } else {
        await fetchNotes();
        showToast('Note updated', 'success');
      }
    } else {
      // Create new note
      const { error } = await supabase
        .from('notes')
        .insert([{ title, content }]);
      if (error) {
        console.error('Error inserting note:', error);
        showToast('Failed to save note', 'error');
      } else {
        await fetchNotes();
        showToast('Note created', 'success');
      }
    }
    modal.style.display = 'none';
    currentNote = null;
  };

  // Close modal when clicking outside
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentNote = null;
    }
  };
}

// Edit note
function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  currentNote = id;
  const modal = document.getElementById('note-modal');
  const modalTitle = modal.querySelector('h2');
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');

  modalTitle.textContent = 'Edit Note';
  titleInput.value = note.title;
  contentInput.value = note.content;
  modal.style.display = 'flex';
}

// Delete note
async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this note?')) return;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting note:', error);
    showToast('Failed to delete note', 'error');
  } else {
    await fetchNotes();
    showToast('Note deleted', 'success');
  }
}

// Show note detail view
function showNoteDetail(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  const modal = document.getElementById('note-detail-modal');
  const title = modal.querySelector('.detail-title');
  const content = modal.querySelector('.detail-content');
  const date = modal.querySelector('.detail-date');

  title.textContent = note.title;
  content.textContent = note.content;
  date.textContent = `Last updated: ${new Date(note.updated_at).toLocaleString()}`;

  modal.style.display = 'flex';
  modal.dataset.noteId = id;
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-notes');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderNotes();
    });
  }
}

// Utility: escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Listen for edit events from the detail modal
document.addEventListener('editNote', (e) => {
  editNote(e.detail.id);
});