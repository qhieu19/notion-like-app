// js/tasks.js - Task tracking with new list view
import { initSupabase, showToast } from './main.js';

let supabase = null;
let allTasks = [];
let currentFilter = 'todo';
let editingTaskId = null;

// Format date to readable string
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function capitalizeStatus(status) {
  const map = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
    'backlog': 'Backlog'
  };
  return map[status] || status;
}

async function loadTasks() {
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allTasks = data || [];
    updateCounts();
    renderTasks();
  } catch (err) {
    console.error('Failed to load tasks', err);
    showToast('Failed to load tasks', 'error');
  }
}

function updateCounts() {
  const counts = {
    'todo': 0,
    'in-progress': 0,
    'done': 0
  };

  allTasks.forEach(task => {
    if (counts.hasOwnProperty(task.status)) {
      counts[task.status]++;
    }
  });

  document.getElementById('count-todo').textContent = counts['todo'];
  document.getElementById('count-in-progress').textContent = counts['in-progress'];
  document.getElementById('count-done').textContent = counts['done'];
}

function renderTasks() {
  const container = document.getElementById('task-list');
  const filtered = allTasks.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks in this status. Press + to create one.</p>';
    return;
  }

  container.innerHTML = filtered.map(task => `
    <div class="task-card" data-task-id="${task.id}">
      <div class="task-header">
        <div class="task-title">${task.title}</div>
        <div class="task-priority ${task.priority}">${task.priority.toUpperCase()}</div>
      </div>
      ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
      <div class="task-meta">
        <span>📊 ${capitalizeStatus(task.task_column)}</span>
        <span>📅 ${new Date(task.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');

  // Attach click handlers
  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => showTaskDetail(card.dataset.taskId));
  });
}

function showTaskDetail(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-priority').innerHTML = `<span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>`;
  document.getElementById('detail-status').textContent = capitalizeStatus(task.status);
  document.getElementById('detail-description').textContent = task.description || 'No description';
  document.getElementById('detail-column').textContent = capitalizeStatus(task.task_column);
  document.getElementById('detail-created').textContent = formatDateTime(task.created_at);

  const toggleBtn = document.getElementById('btn-toggle-status');
  if (task.status === 'done') {
    toggleBtn.textContent = 'Move to To Do';
  } else {
    toggleBtn.textContent = 'Mark as Done';
  }

  // Store current task ID for actions
  document.getElementById('task-detail-modal').dataset.taskId = taskId;
  document.getElementById('task-detail-modal').classList.add('show');
}

function closeTaskDetail() {
  document.getElementById('task-detail-modal').classList.remove('show');
}

function openTaskForm(taskId = null) {
  const modal = document.getElementById('task-form-modal');
  const form = document.getElementById('task-form');
  const title = document.getElementById('form-title');

  if (taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    title.textContent = 'Edit task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-column').value = task.task_column;
    editingTaskId = taskId;
  } else {
    title.textContent = 'New task';
    form.reset();
    document.getElementById('task-status').value = currentFilter;
    editingTaskId = null;
  }

  modal.style.display = 'flex';
  document.getElementById('task-title').focus();
}

function closeTaskForm() {
  document.getElementById('task-form-modal').style.display = 'none';
  editingTaskId = null;
}

async function saveTask(e) {
  e.preventDefault();

  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const status = document.getElementById('task-status').value;
  const priority = document.getElementById('task-priority').value;
  const task_column = document.getElementById('task-column').value;

  if (!title) return;

  const taskData = {
    title,
    description,
    status,
    priority,
    task_column,
    updated_at: new Date().toISOString()
  };

  try {
    if (editingTaskId) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTaskId);

      if (error) throw error;
      showToast('Task updated', 'success');
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert(taskData);

      if (error) throw error;
      showToast('Task created', 'success');
    }

    closeTaskForm();
    await loadTasks();
  } catch (err) {
    console.error('Failed to save task', err);
    showToast('Failed to save task', 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task? This cannot be undone.')) return;

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    showToast('Task deleted', 'info');
    closeTaskDetail();
    await loadTasks();
  } catch (err) {
    console.error('Failed to delete task', err);
    showToast('Failed to delete task', 'error');
  }
}

async function toggleTaskStatus(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  const newStatus = task.status === 'done' ? 'todo' : 'done';

  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    showToast(newStatus === 'done' ? 'Task completed!' : 'Task moved to To Do', 'success');
    closeTaskDetail();
    await loadTasks();
  } catch (err) {
    console.error('Failed to update task', err);
    showToast('Failed to update task', 'error');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  supabase = await initSupabase();

  // Set current date
  document.getElementById('current-date').textContent = formatDate(new Date().toISOString());

  // Status filter buttons
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      renderTasks();
    });
  });

  // Add task button
  document.getElementById('add-task-btn').addEventListener('click', () => openTaskForm());

  // Task form
  document.getElementById('task-form').addEventListener('submit', saveTask);
  document.getElementById('cancel-task').addEventListener('click', closeTaskForm);

  // Task detail modal
  document.getElementById('close-detail').addEventListener('click', closeTaskDetail);
  document.getElementById('task-detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'task-detail-modal') closeTaskDetail();
  });

  document.getElementById('btn-edit-task').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    closeTaskDetail();
    openTaskForm(taskId);
  });

  document.getElementById('btn-delete-task').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    deleteTask(taskId);
  });

  document.getElementById('btn-toggle-status').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    toggleTaskStatus(taskId);
  });

  await loadTasks();
});
