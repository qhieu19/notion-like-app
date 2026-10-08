// tasks.js - Handle tasks CRUD and kanban board
import { initSupabase } from './main.js';

let supabase;
let isDemo = false;
let tasks = []; // Cache for demo mode

async function init() {
  if (window.isDemo()) {
    isDemo = true;
    console.log('Tasks: demo mode');
    tasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
    renderBoard();
    setupForm();
  } else {
    supabase = await initSupabase();
    fetchTasks();
    setupForm();
  }
}

// Fetch tasks from Supabase
async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks:', error);
    showError('Failed to load tasks');
  } else {
    tasks = data;
    renderBoard();
  }
}

// Render kanban board
function renderBoard() {
  const columns = ['backlog', 'todo', 'in-progress', 'done'];
  columns.forEach(col => {
    const columnTasks = tasks.filter(t => t.column === col);
    const column = document.querySelector(`.column[data-column="${col}"]`);
    const header = column.querySelector('.count');
    const body = column.querySelector('.column-body');
    header.textContent = columnTasks.length;
    body.innerHTML = columnTasks.map(task => `
      <div class="task-card" data-id="${task.id}" data-column="${task.column}">
        <h4>${escapeHtml(task.title)}</h4>
        <p>${escapeHtml(task.description).substring(0, 80)}</p>
        <div class="task-meta">
          <span class="priority ${task.priority}">${task.priority}</span>
          <small>${new Date(task.updated_at).toLocaleString()}</small>
        </div>
        <select class="move-column" data-task-id="${task.id}">
          <option value="backlog" ${task.column === 'backlog' ? 'selected' : ''}>Backlog</option>
          <option value="todo" ${task.column === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="in-progress" ${task.column === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${task.column === 'done' ? 'selected' : ''}>Done</option>
        </select>
      </div>
    `).join('');
  });
}

// Setup form submit and cancel
function setupForm() {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const cancelBtn = document.getElementById('cancel-task');
  const newTaskBtn = document.getElementById('new-task-btn');

  newTaskBtn.onclick = () => {
    form.reset();
    modal.style.display = 'block';
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const column = document.getElementById('task-column').value;
    if (!title) return;

    if (isDemo) {
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        priority,
        column,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      tasks.unshift(newTask);
      localStorage.setItem('demo-tasks', JSON.stringify(tasks));
      renderBoard();
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([{ title, description, priority, column }]);
      if (error) {
        console.error('Error inserting task:', error);
        showError('Failed to save task');
      } else {
        await fetchTasks();
      }
    }
    modal.style.display = 'none';
  };

  // Close modal when clicking outside
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // Move task between columns
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('move-column')) {
      const taskId = e.target.dataset.taskId;
      const newColumn = e.target.value;
      if (isDemo) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.column = newColumn;
          task.updated_at = new Date().toISOString();
          localStorage.setItem('demo-tasks', JSON.stringify(tasks));
          renderBoard();
        }
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({ column: newColumn, updated_at: new Date().toISOString() })
          .eq('id', taskId);
        if (error) {
          console.error('Error moving task:', error);
          showError('Failed to move task');
        } else {
          await fetchTasks();
        }
      }
    }
  });
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