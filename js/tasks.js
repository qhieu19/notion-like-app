// js/tasks.js - Bootstrap clean style
import { initSupabase, showToast } from './main.js';

let supabase = null;
let allTasks = [];
let currentFilter = 'todo';
let editingTaskId = null;

function formatDate(isoString) {
  const d = new Date(isoString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  return `${days[d.getDay()]}, ${d.getDate()}/${months[d.getMonth()]}/${d.getFullYear()}`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function capitalizeStatus(status) {
  const map = {
    'todo': 'To do',
    'in-progress': 'In progress',
    'done': 'Done',
    'backlog': 'Backlog'
  };
  return map[status] || status;
}

function getPriorityBadge(priority) {
  const map = {
    'high': 'bs-badge-danger',
    'medium': 'bs-badge-warning',
    'low': 'bs-badge-success'
  };
  return map[priority] || 'bs-badge-success';
}

function getPriorityLabel(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
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
    renderTasks();
  } catch (err) {
    console.error('Failed to load tasks', err);
    showToast('Failed to load tasks', 'error');
  }
}

function renderTasks() {
  const container = document.getElementById('task-list');
  const filtered = allTasks.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center; margin-top:2rem;">No tasks in this status. Click Create new task to add one.</p>';
    return;
  }

  container.innerHTML = filtered.map(task => `
    <div class="bs-list-item" data-task-id="${task.id}">
      <div class="bs-task-title">${task.title}</div>
      <div class="bs-task-meta">
        <span class="bs-badge ${getPriorityBadge(task.priority)}">${getPriorityLabel(task.priority)}</span>
        <span style="color:#6c757d;">${capitalizeStatus(task.task_column)}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.bs-list-item').forEach(item => {
    item.addEventListener('click', () => showTaskDetail(item.dataset.taskId));
  });
}

function showTaskDetail(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-status').textContent = capitalizeStatus(task.status);
  document.getElementById('detail-priority').innerHTML = `<span class="bs-badge ${getPriorityBadge(task.priority)}">${getPriorityLabel(task.priority)}</span>`;
  document.getElementById('detail-description').textContent = task.description || 'No description';
  document.getElementById('detail-column').textContent = capitalizeStatus(task.task_column);
  document.getElementById('detail-created').textContent = formatDateTime(task.created_at);

  const modal = document.getElementById('task-detail-modal');
  modal.dataset.taskId = taskId;
  modal.classList.add('show');
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

async function changeTaskStatus(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  // Cycle through: todo -> in-progress -> done -> todo
  const statusCycle = {
    'todo': 'in-progress',
    'in-progress': 'done',
    'done': 'todo'
  };
  const newStatus = statusCycle[task.status] || 'todo';

  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    showToast(`Task moved to ${capitalizeStatus(newStatus)}`, 'success');
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

  // Nav tabs
  document.querySelectorAll('.bs-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.bs-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentFilter = link.dataset.status;
      renderTasks();
    });
  });

  // Create button
  document.getElementById('btn-create').addEventListener('click', () => openTaskForm());

  // Task form
  document.getElementById('task-form').addEventListener('submit', saveTask);
  document.getElementById('cancel-task').addEventListener('click', closeTaskForm);

  // Task detail modal
  document.getElementById('close-detail').addEventListener('click', closeTaskDetail);
  document.getElementById('task-detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'task-detail-modal') closeTaskDetail();
  });

  document.getElementById('btn-edit').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    closeTaskDetail();
    openTaskForm(taskId);
  });

  document.getElementById('btn-delete').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    deleteTask(taskId);
  });

  document.getElementById('btn-change-status').addEventListener('click', () => {
    const taskId = document.getElementById('task-detail-modal').dataset.taskId;
    changeTaskStatus(taskId);
  });

  await loadTasks();
});
