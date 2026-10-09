// js/tasks.js - Task tracking blue theme matching UI
import { initSupabase, showToast } from './main.js';

let supabase = null;
let allTasks = [];
let editingTaskId = null;

function formatDate(isoString) {
  const d = new Date(isoString);
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN');
}

function capitalizeStatus(status) {
  const map = {
    'todo': 'Cần làm',
    'in-progress': 'Đang làm',
    'done': 'Hoàn thành',
    'backlog': 'Backlog'
  };
  return map[status] || status;
}

function capitalizePriority(priority) {
  const map = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao'
  };
  return map[priority] || priority;
}

function capitalizeColumn(col) {
  const map = {
    'backlog': 'Backlog',
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done'
  };
  return map[col] || col;
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
    updateStats();
    renderTasks();
  } catch (err) {
    console.error('Failed to load tasks', err);
    showToast('Không thể tải tasks', 'error');
  }
}

function updateStats() {
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

  document.getElementById('stat-todo').textContent = counts['todo'];
  document.getElementById('stat-in-progress').textContent = counts['in-progress'];
  document.getElementById('stat-done').textContent = counts['done'];

  // Show active task (first in-progress)
  const activeTask = allTasks.find(t => t.status === 'in-progress');
  const activeSection = document.getElementById('active-section');

  if (activeTask) {
    activeSection.style.display = 'block';
    document.getElementById('active-title').textContent = activeTask.title;
    document.getElementById('active-meta').textContent = activeTask.description || 'Không có mô tả';
    document.getElementById('active-deadline').textContent = 'Hạn hôm nay';

    // Mock progress: 66% (2/3 done)
    document.getElementById('active-progress').style.width = '66%';

    document.getElementById('btn-complete-active').onclick = () => toggleTaskStatus(activeTask.id);
    document.getElementById('active-card').onclick = (e) => {
      if (e.target.id !== 'btn-complete-active') {
        showTaskDetail(activeTask.id);
      }
    };
  } else {
    activeSection.style.display = 'none';
  }
}

function renderTasks() {
  const container = document.getElementById('task-list');

  if (allTasks.length === 0) {
    container.innerHTML = '<p class="empty-state">Chưa có task. Nhấn Thêm để tạo mới.</p>';
    return;
  }

  // Mock: check if overdue (for demo, mark "high" priority as overdue)
  container.innerHTML = allTasks.map((task, idx) => {
    const isOverdue = task.priority === 'high'; // mock
    const progressPercent = idx === 0 ? 66 : idx === 1 ? 0 : 0; // mock 2/3, 0/2, 0/4
    const doneCount = idx === 0 ? 2 : 0;
    const totalCount = idx === 0 ? 3 : idx === 1 ? 2 : 4;

    return `
      <div class="task-item" data-task-id="${task.id}">
        <div class="task-item-header">
          <div class="task-item-title">${task.title}</div>
          ${isOverdue ? '<div class="badge-overdue">Quá hạn 2 ngày</div>' : `<div class="badge-status">${capitalizeStatus(task.status)}</div>`}
        </div>
        <div class="task-item-meta">${capitalizeColumn(task.task_column)} · ${capitalizePriority(task.priority)}</div>
        <div class="task-item-progress">
          <div class="mini-progress">
            <div class="mini-progress-bar" style="width: ${progressPercent}%"></div>
          </div>
          <div class="task-count">${doneCount}/${totalCount}</div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click handlers
  container.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('click', () => showTaskDetail(item.dataset.taskId));
  });
}

function showTaskDetail(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-status').textContent = capitalizeStatus(task.status);
  document.getElementById('detail-priority').textContent = capitalizePriority(task.priority);
  document.getElementById('detail-description').textContent = task.description || 'Không có mô tả';
  document.getElementById('detail-column').textContent = capitalizeColumn(task.task_column);
  document.getElementById('detail-created').textContent = formatDateTime(task.created_at);

  const toggleBtn = document.getElementById('btn-toggle-status');
  if (task.status === 'done') {
    toggleBtn.textContent = 'Chuyển sang Cần làm';
  } else {
    toggleBtn.textContent = 'Hoàn thành';
  }

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

    title.textContent = 'Sửa task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-column').value = task.task_column;
    editingTaskId = taskId;
  } else {
    title.textContent = 'Task mới';
    form.reset();
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
      showToast('Task đã cập nhật', 'success');
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert(taskData);

      if (error) throw error;
      showToast('Task đã tạo', 'success');
    }

    closeTaskForm();
    await loadTasks();
  } catch (err) {
    console.error('Failed to save task', err);
    showToast('Không thể lưu task', 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Xóa task này? Không thể hoàn tác.')) return;

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    showToast('Task đã xóa', 'info');
    closeTaskDetail();
    await loadTasks();
  } catch (err) {
    console.error('Failed to delete task', err);
    showToast('Không thể xóa task', 'error');
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

    showToast(newStatus === 'done' ? 'Task hoàn thành!' : 'Task chuyển sang Cần làm', 'success');
    closeTaskDetail();
    await loadTasks();
  } catch (err) {
    console.error('Failed to update task', err);
    showToast('Không thể cập nhật task', 'error');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  supabase = await initSupabase();

  // Set current date
  document.getElementById('current-date-small').textContent = formatDate(new Date().toISOString());

  // Bottom nav - Add button
  document.getElementById('nav-add').addEventListener('click', () => openTaskForm());

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
