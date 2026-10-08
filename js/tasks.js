// tasks.js - Handle tasks CRUD and kanban board
import { initSupabase, showToast } from './main.js';

let supabase;
let isDemo = false;
let tasks = []; // Cache for demo mode
let currentTask = null; // For editing
let searchQuery = '';

async function init() {
  if (window.isDemo()) {
    isDemo = true;
    console.log('Tasks: demo mode');
    tasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
    renderBoard();
    setupForm();
    setupSearch();
  } else {
    supabase = await initSupabase();
    fetchTasks();
    setupForm();
    setupSearch();
  }
}

// Fetch tasks from Supabase
async function fetchTasks() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'block';

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (loading) loading.style.display = 'none';

  if (error) {
    console.error('Error fetching tasks:', error);
    showToast('Failed to load tasks', 'error');
  } else {
    tasks = data;
    renderBoard();
  }
}

// Render kanban board
function renderBoard() {
  const columns = ['backlog', 'todo', 'in-progress', 'done'];

  // Filter tasks based on search
  const filteredTasks = searchQuery
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks;

  columns.forEach(col => {
    const columnTasks = filteredTasks.filter(t => t.column === col);
    const column = document.querySelector(`.column[data-column="${col}"]`);
    const header = column.querySelector('.count');
    const body = column.querySelector('.column-body');
    header.textContent = columnTasks.length;
    body.innerHTML = columnTasks.length === 0
      ? '<p class="column-empty">No tasks</p>'
      : columnTasks.map(task => `
        <div class="task-card" data-id="${task.id}" data-column="${task.task_column}">
          <div class="task-card-header">
            <h4>${escapeHtml(task.title)}</h4>
            <div class="task-card-actions">
              <button class="btn-icon-small edit-task" data-id="${task.id}" title="Edit">✏️</button>
              <button class="btn-icon-small delete-task" data-id="${task.id}" title="Delete">🗑️</button>
            </div>
          </div>
          ${task.description ? `<p>${escapeHtml(task.description).substring(0, 80)}${task.description.length > 80 ? '...' : ''}</p>` : ''}
          <div class="task-meta">
            <span class="priority ${task.priority}">${task.priority}</span>
            <small>${new Date(task.updated_at).toLocaleDateString()}</small>
          </div>
          <select class="move-column" data-task-id="${task.id}">
            <option value="backlog" ${task.task_column === 'backlog' ? 'selected' : ''}>Backlog</option>
            <option value="todo" ${task.task_column === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="in-progress" ${task.task_column === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${task.task_column === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
      `).join('');
  });

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editTask(e.target.dataset.id);
    });
  });

  document.querySelectorAll('.delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(e.target.dataset.id);
    });
  });
}

// Setup form submit and cancel
function setupForm() {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const cancelBtn = document.getElementById('cancel-task');
  const newTaskBtn = document.getElementById('new-task-btn');
  const modalTitle = modal.querySelector('h2');

  newTaskBtn.onclick = () => {
    currentTask = null;
    form.reset();
    modalTitle.textContent = 'New Task';
    modal.style.display = 'flex';
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
    currentTask = null;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const task_column = document.getElementById('task-column').value;
    if (!title) return;

    if (isDemo) {
      if (currentTask) {
        // Update existing task
        const task = tasks.find(t => t.id === currentTask);
        if (task) {
          task.title = title;
          task.description = description;
          task.priority = priority;
          task.task_column = task_column;
          task.updated_at = new Date().toISOString();
        }
      } else {
        // Create new task
        const newTask = {
          id: Date.now().toString(),
          title,
          description,
          priority,
          task_column,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        tasks.unshift(newTask);
      }
      localStorage.setItem('demo-tasks', JSON.stringify(tasks));
      renderBoard();
      showToast(currentTask ? 'Task updated' : 'Task created', 'success');
    } else {
      if (currentTask) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({ title, description, priority, task_column, updated_at: new Date().toISOString() })
          .eq('id', currentTask);
        if (error) {
          console.error('Error updating task:', error);
          showToast('Failed to update task', 'error');
        } else {
          await fetchTasks();
          showToast('Task updated', 'success');
        }
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert([{ title, description, priority, task_column }]);
        if (error) {
          console.error('Error inserting task:', error);
          showToast('Failed to save task', 'error');
        } else {
          await fetchTasks();
          showToast('Task created', 'success');
        }
      }
    }
    modal.style.display = 'none';
    currentTask = null;
  };

  // Close modal when clicking outside
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentTask = null;
    }
  };

  // Move task between columns
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('move-column')) {
      const taskId = e.target.dataset.taskId;
      const newColumn = e.target.value;
      if (isDemo) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.task_column = newColumn;
          task.updated_at = new Date().toISOString();
          localStorage.setItem('demo-tasks', JSON.stringify(tasks));
          renderBoard();
          showToast('Task moved', 'success');
        }
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({ task_column: newColumn, updated_at: new Date().toISOString() })
          .eq('id', taskId);
        if (error) {
          console.error('Error moving task:', error);
          showToast('Failed to move task', 'error');
        } else {
          await fetchTasks();
          showToast('Task moved', 'success');
        }
      }
    }
  });
}

// Edit task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  currentTask = id;
  const modal = document.getElementById('task-modal');
  const modalTitle = modal.querySelector('h2');

  modalTitle.textContent = 'Edit Task';
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-column').value = task.task_column;
  modal.style.display = 'flex';
}

// Delete task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  if (isDemo) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('demo-tasks', JSON.stringify(tasks));
    renderBoard();
    showToast('Task deleted', 'success');
  } else {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    } else {
      await fetchTasks();
      showToast('Task deleted', 'success');
    }
  }
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-tasks');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderBoard();
    });
  }
}

// Utility: escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);