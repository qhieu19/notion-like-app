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

    const todaySessions = getHistory().filter(h => h.date === getTodayDateString());
    if (todaySessions.length > 0) {
      const todayTotal = todaySessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
      const last = todaySessions[0];
      timerEl.textContent = formatDuration(todayTotal);
      statusText.textContent = `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`;
      startInfo.textContent = `Last: ${formatTime(last.checkInTime)} – ${formatTime(last.checkOutTime)}`;
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

  // Group sessions by date
  const byDate = {};
  for (const item of history) {
    if (!byDate[item.date]) byDate[item.date] = [];
    byDate[item.date].push(item);
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  if (countEl) {
    countEl.textContent = `${dates.length} day${dates.length === 1 ? '' : 's'} logged`;
  }

  if (!container) return;

  if (dates.length === 0) {
    container.innerHTML = '<p class="empty-state">No time logs yet. Press Check-in to start your first session.</p>';
    return;
  }

  container.innerHTML = dates.map(date => {
    const sessions = byDate[date];
    const totalMs = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    const rows = sessions.map((s, i) => `
      <div class="history-item" style="padding-left:12px; border-left: 2px solid var(--border); margin-top:6px;">
        <div>
          <div class="history-times" style="font-size:12px;">Session ${i + 1}: ${formatTime(s.checkInTime)} – ${formatTime(s.checkOutTime)}</div>
        </div>
        <div class="history-duration" style="font-size:12px;">${formatDuration(s.durationMs)}</div>
      </div>
    `).join('');
    return `
      <div style="margin-bottom:12px;">
        <div class="history-item">
          <div>
            <div class="history-date">${date}</div>
            <div class="history-times" style="font-size:11px; margin-top:2px;">${sessions.length} session${sessions.length > 1 ? 's' : ''}</div>
          </div>
          <div class="history-duration">${formatDuration(totalMs)}</div>
        </div>
        ${rows}
      </div>
    `;
  }).join('');
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

  if (btnIn) btnIn.addEventListener('click', handleCheckIn);
  if (btnOut) btnOut.addEventListener('click', handleCheckOut);

  updateDisplay();
});
