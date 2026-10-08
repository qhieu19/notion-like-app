// js/tracker.js - High-performance lightweight time tracker
import { showToast } from './main.js';

const STORAGE_KEY_CURRENT = 'skax_tracker_active_session';
const STORAGE_KEY_HISTORY = 'skax_tracker_history';

let timerInterval = null;

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
  const startInfo = document.getElementById('session-start-info');
  const btnCheckIn = document.getElementById('btn-checkin');
  const btnCheckOut = document.getElementById('btn-checkout');

  if (session && !session.checkOutTime) {
    // Currently checked in
    const elapsed = Date.now() - new Date(session.checkInTime).getTime();
    timerEl.textContent = formatDuration(elapsed);
    statusEl.classList.add('active');
    statusText.textContent = 'Active Working Session';
    startInfo.textContent = `Checked in at ${formatTime(session.checkInTime)}`;

    btnCheckIn.disabled = true;
    btnCheckOut.disabled = false;

    if (!timerInterval) {
      timerInterval = setInterval(() => {
        const currSession = getActiveSession();
        if (currSession && !currSession.checkOutTime) {
          const diff = Date.now() - new Date(currSession.checkInTime).getTime();
          timerEl.textContent = formatDuration(diff);
        }
      }, 1000);
    }
  } else {
    // Checked out or idle
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    statusEl.classList.remove('active');
    btnCheckIn.disabled = false;
    btnCheckOut.disabled = true;

    if (session && session.checkOutTime) {
      const duration = new Date(session.checkOutTime) - new Date(session.checkInTime);
      timerEl.textContent = formatDuration(duration);
      statusText.textContent = 'Session Completed Today';
      startInfo.textContent = `From ${formatTime(session.checkInTime)} to ${formatTime(session.checkOutTime)}`;
    } else {
      timerEl.textContent = '00:00:00';
      statusText.textContent = 'Ready to Check-in';
      startInfo.textContent = 'No active session today';
    }
  }

  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const countEl = document.getElementById('total-days-count');
  const history = getHistory();

  if (countEl) {
    countEl.textContent = `${history.length} day${history.length === 1 ? '' : 's'} logged`;
  }

  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-state">No time logs yet. Press Check-in to start your first session.</p>';
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="history-item">
      <div>
        <div class="history-date">${item.date}</div>
        <div class="history-times">${formatTime(item.checkInTime)} - ${formatTime(item.checkOutTime)}</div>
      </div>
      <div class="history-duration">${formatDuration(item.durationMs)}</div>
    </div>
  `).join('');
}

// Handlers
function handleCheckIn() {
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

  const checkOutTime = new Date().toISOString();
  session.checkOutTime = checkOutTime;
  const durationMs = Math.max(0, new Date(checkOutTime) - new Date(session.checkInTime));
  session.durationMs = durationMs;

  // Save to history
  const history = getHistory();
  // If already logged today, replace or prepend
  const existingIdx = history.findIndex(h => h.date === session.date);
  if (existingIdx >= 0) {
    history[existingIdx] = session;
  } else {
    history.unshift(session);
  }

  saveHistory(history);
  localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(session));

  showToast(`Checked out! Worked for ${formatDuration(durationMs)}`, 'info');
  updateDisplay();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const btnIn = document.getElementById('btn-checkin');
  const btnOut = document.getElementById('btn-checkout');

  if (btnIn) btnIn.addEventListener('click', handleCheckIn);
  if (btnOut) btnOut.addEventListener('click', handleCheckOut);

  updateDisplay();
});
