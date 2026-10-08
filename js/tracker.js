// js/tracker.js - High-performance lightweight time tracker
import { showToast } from './main.js';

const STORAGE_KEY_CURRENT = 'skax_tracker_active_session';
const STORAGE_KEY_HISTORY = 'skax_tracker_history';

let currentView = 'today'; // 'today' or 'month'

// Helper: Format milliseconds into HH:MM:SS
function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(val => String(val).padStart(2, '0'))
    .join(':');
}

// Helper: Format timestamp to 12h or 24h readable time
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper: Format timestamp to HH:MM for time input value
function formatTimeInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get active session
function getActiveSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Get history array
function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save history', err);
  }
}

// Check day rollover: If session is from a previous day, auto close it at midnight or archive
function handleDayRollover(session) {
  if (!session) return null;
  const sessionDate = session.checkInTime.split('T')[0];
  const today = getTodayDateString();

  if (sessionDate !== today) {
    // Session is from a past day: close it out to past history
    const checkOut = session.checkOutTime || new Date(sessionDate + 'T23:59:59').toISOString();
    const durationMs = Math.max(0, new Date(checkOut) - new Date(session.checkInTime));

    const history = getHistory();
    history.unshift({
      date: sessionDate,
      checkInTime: session.checkInTime,
      checkOutTime: checkOut,
      durationMs
    });
    saveHistory(history);
    localStorage.removeItem(STORAGE_KEY_CURRENT);
    return null;
  }
  return session;
}

// Update UI elements
function updateDisplay() {
  let session = handleDayRollover(getActiveSession());

  const timerEl = document.getElementById('timer-display');
  const statusEl = document.getElementById('session-status');
  const statusText = document.getElementById('status-text');
  const btnCheckIn = document.getElementById('btn-checkin');
  const btnCheckOut = document.getElementById('btn-checkout');

  const todaySessions = getHistory().filter(h => h.date === getTodayDateString());
  const todayTotal = todaySessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  timerEl.textContent = formatDuration(todayTotal);

  if (session && !session.checkOutTime) {
    // Currently checked in
    statusEl.classList.add('active');
    statusText.textContent = 'Working now';
    btnCheckIn.disabled = true;
    btnCheckOut.disabled = false;
  } else {
    // Checked out or idle
    statusEl.classList.remove('active');
    btnCheckIn.disabled = false;
    btnCheckOut.disabled = true;

    if (todaySessions.length > 0) {
      statusText.textContent = `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`;
    } else {
      statusText.textContent = 'Ready to Check-in';
    }
  }

  renderHistory();
}

function renderHistory() {
  if (currentView === 'today') {
    renderTodayView();
  } else {
    renderMonthView();
  }
}

function renderTodayView() {
  const container = document.getElementById('history-list');
  const countEl = document.getElementById('total-days-count');
  const todaySessions = getHistory().filter(h => h.date === getTodayDateString());

  if (countEl) {
    const totalMs = todaySessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    countEl.textContent = `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} · ${formatDuration(totalMs)}`;
  }

  if (!container) return;

  if (todaySessions.length === 0) {
    container.innerHTML = '<p class="empty-state">No sessions today. Press Check-in to start.</p>';
    return;
  }

  container.innerHTML = todaySessions.map((s, i) => `
    <div class="history-item" id="session-${i}">
      <div style="flex: 1;">
        <div class="history-date">Session ${i + 1}</div>
        <div class="history-times" id="times-${i}">${formatTime(s.checkInTime)} – ${formatTime(s.checkOutTime)}</div>
        <div id="edit-form-${i}" style="display: none; margin-top: 8px; gap: 8px;">
          <input type="time" id="edit-in-${i}" value="${formatTimeInput(s.checkInTime)}" style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg); color: var(--text);">
          <span style="color: var(--text-muted);">–</span>
          <input type="time" id="edit-out-${i}" value="${formatTimeInput(s.checkOutTime)}" style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg); color: var(--text);">
          <button class="btn-save-session" data-index="${i}" style="padding: 4px 12px; background: var(--primary); color: #fff; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Save</button>
          <button class="btn-cancel-edit" data-index="${i}" style="padding: 4px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; cursor: pointer;">Cancel</button>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="history-duration">${formatDuration(s.durationMs)}</div>
        <button class="btn-edit-session" data-index="${i}" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; padding:4px;">✎</button>
      </div>
    </div>
  `).join('');

  // Attach edit handlers
  container.querySelectorAll('.btn-edit-session').forEach(btn => {
    btn.addEventListener('click', () => showEditForm(parseInt(btn.dataset.index)));
  });

  container.querySelectorAll('.btn-save-session').forEach(btn => {
    btn.addEventListener('click', () => handleSaveSession(parseInt(btn.dataset.index), btn));
  });

  container.querySelectorAll('.btn-cancel-edit').forEach(btn => {
    btn.addEventListener('click', () => hideEditForm(parseInt(btn.dataset.index)));
  });
}

function renderMonthView() {
  const container = document.getElementById('history-list');
  const countEl = document.getElementById('total-days-count');
  const history = getHistory();

  // Filter to current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthHistory = history.filter(h => h.date.startsWith(currentMonth));

  // Group by date and sum
  const byDate = {};
  for (const item of thisMonthHistory) {
    if (!byDate[item.date]) {
      byDate[item.date] = { count: 0, totalMs: 0 };
    }
    byDate[item.date].count++;
    byDate[item.date].totalMs += item.durationMs || 0;
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  if (countEl) {
    countEl.textContent = `${dates.length} day${dates.length === 1 ? '' : 's'} this month`;
  }

  if (!container) return;

  if (dates.length === 0) {
    container.innerHTML = '<p class="empty-state">No time logs this month.</p>';
    return;
  }

  container.innerHTML = dates.map(date => {
    const { count, totalMs } = byDate[date];
    return `
      <div class="history-item">
        <div>
          <div class="history-date">${date}</div>
          <div class="history-times">${count} session${count > 1 ? 's' : ''}</div>
        </div>
        <div class="history-duration">${formatDuration(totalMs)}</div>
      </div>
    `;
  }).join('');
}

// Handlers
function handleCheckIn() {
  const btnIn = document.getElementById('btn-checkin');
  btnIn.textContent = 'Wait...';
  btnIn.disabled = true;

  const today = getTodayDateString();
  const now = new Date().toISOString();

  const newSession = {
    date: today,
    checkInTime: now,
    checkOutTime: null
  };

  localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(newSession));
  showToast('Checked in successfully! Timer started.', 'success');
  updateDisplay();
}

function handleCheckOut() {
  const session = getActiveSession();
  if (!session || session.checkOutTime) return;

  const btnOut = document.getElementById('btn-checkout');
  btnOut.textContent = 'Wait...';
  btnOut.disabled = true;

  const checkOutTime = new Date().toISOString();
  session.checkOutTime = checkOutTime;
  const durationMs = Math.max(0, new Date(checkOutTime) - new Date(session.checkInTime));
  session.durationMs = durationMs;

  // Save to history — always append new session interval
  const history = getHistory();
  history.unshift({ date: session.date, checkInTime: session.checkInTime, checkOutTime: session.checkOutTime, durationMs });

  saveHistory(history);
  localStorage.removeItem(STORAGE_KEY_CURRENT); // clear so next check-in starts fresh interval

  showToast(`Checked out! Worked for ${formatDuration(durationMs)}`, 'info');
  updateDisplay();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const btnIn = document.getElementById('btn-checkin');
  const btnOut = document.getElementById('btn-checkout');
  const tabToday = document.getElementById('tab-today');
  const tabMonth = document.getElementById('tab-month');

  if (btnIn) btnIn.addEventListener('click', handleCheckIn);
  if (btnOut) btnOut.addEventListener('click', handleCheckOut);

  if (tabToday) {
    tabToday.addEventListener('click', () => {
      currentView = 'today';
      tabToday.classList.add('active');
      tabMonth.classList.remove('active');
      renderHistory();
    });
  }

  if (tabMonth) {
    tabMonth.addEventListener('click', () => {
      currentView = 'month';
      tabMonth.classList.add('active');
      tabToday.classList.remove('active');
      renderHistory();
    });
  }

  updateDisplay();
});

function showEditForm(index) {
  const timesEl = document.getElementById(`times-${index}`);
  const formEl = document.getElementById(`edit-form-${index}`);
  if (timesEl) timesEl.style.display = 'none';
  if (formEl) formEl.style.display = 'flex';
}

function hideEditForm(index) {
  const timesEl = document.getElementById(`times-${index}`);
  const formEl = document.getElementById(`edit-form-${index}`);
  if (timesEl) timesEl.style.display = 'block';
  if (formEl) formEl.style.display = 'none';
}

function handleSaveSession(index, btn) {
  const todaySessions = getHistory().filter(h => h.date === getTodayDateString());
  const session = todaySessions[index];
  if (!session) return;

  const inVal = document.getElementById(`edit-in-${index}`).value;
  const outVal = document.getElementById(`edit-out-${index}`).value;
  if (!inVal || !outVal) return;

  // Show loading state
  const origText = btn.textContent;
  btn.textContent = 'Wait...';
  btn.disabled = true;

  const date = session.date;
  const checkInTime = new Date(`${date}T${inVal}:00`).toISOString();
  const checkOutTime = new Date(`${date}T${outVal}:00`).toISOString();
  const durationMs = Math.max(0, new Date(checkOutTime) - new Date(checkInTime));

  // Find in full history and update
  const history = getHistory();
  const fullIndex = history.findIndex(h => h.date === session.date && h.checkInTime === session.checkInTime);
  if (fullIndex >= 0) {
    history[fullIndex] = { date, checkInTime, checkOutTime, durationMs };
    saveHistory(history);
    showToast('Session updated', 'success');
    updateDisplay();
  }
}
