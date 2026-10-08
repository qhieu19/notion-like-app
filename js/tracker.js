// js/tracker.js - SKAX Time Tracker with Supabase sync
import { initSupabase, showToast } from './main.js';

const STORAGE_KEY_CURRENT = 'skax_tracker_active_session';
let currentView = 'today';
let supabase = null;

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

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

function getActiveSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function getHistory() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('time_sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('check_in_time', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      date: row.date,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      durationMs: row.duration_ms
    }));
  } catch (err) {
    console.error('Failed to load history', err);
    return [];
  }
}

async function saveSession(session) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('time_sessions')
      .insert({
        date: session.date,
        check_in_time: session.checkInTime,
        check_out_time: session.checkOutTime,
        duration_ms: session.durationMs
      });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to save session', err);
    showToast('Failed to save session', 'error');
  }
}

async function updateSession(id, session) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('time_sessions')
      .update({
        check_in_time: session.checkInTime,
        check_out_time: session.checkOutTime,
        duration_ms: session.durationMs
      })
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Failed to update session', err);
    showToast('Failed to update session', 'error');
  }
}

async function handleDayRollover(session) {
  if (!session) return null;
  const sessionDate = session.checkInTime.split('T')[0];
  const today = getTodayDateString();

  if (sessionDate !== today) {
    const checkOut = session.checkOutTime || new Date(sessionDate + 'T23:59:59').toISOString();
    const durationMs = Math.max(0, new Date(checkOut) - new Date(session.checkInTime));

    await saveSession({
      date: sessionDate,
      checkInTime: session.checkInTime,
      checkOutTime: checkOut,
      durationMs
    });
    localStorage.removeItem(STORAGE_KEY_CURRENT);
    return null;
  }
  return session;
}

async function updateDisplay() {
  let session = await handleDayRollover(getActiveSession());

  const timerEl = document.getElementById('timer-display');
  const statusEl = document.getElementById('session-status');
  const statusText = document.getElementById('status-text');
  const btnCheckIn = document.getElementById('btn-checkin');
  const btnCheckOut = document.getElementById('btn-checkout');

  const history = await getHistory();
  const todaySessions = history.filter(h => h.date === getTodayDateString());
  const todayTotal = todaySessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  timerEl.textContent = formatDuration(todayTotal);

  if (session && !session.checkOutTime) {
    statusEl.classList.add('active');
    statusText.textContent = 'Working now';
    btnCheckIn.disabled = true;
    btnCheckOut.disabled = false;
  } else {
    statusEl.classList.remove('active');
    btnCheckIn.disabled = false;
    btnCheckOut.disabled = true;

    if (todaySessions.length > 0) {
      statusText.textContent = `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`;
    } else {
      statusText.textContent = 'Ready to Check-in';
    }
  }

  await renderHistory();
}

async function renderHistory() {
  if (currentView === 'today') {
    await renderTodayView();
  } else {
    await renderMonthView();
  }
}

async function renderTodayView() {
  const container = document.getElementById('history-list');
  const countEl = document.getElementById('total-days-count');
  const history = await getHistory();
  const todaySessions = history.filter(h => h.date === getTodayDateString());

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
          <input type="time" id="edit-in-${i}" value="${formatTimeInput(s.checkInTime)}" data-session-id="${s.id}" style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg); color: var(--text);">
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

async function renderMonthView() {
  const container = document.getElementById('history-list');
  const countEl = document.getElementById('total-days-count');
  const history = await getHistory();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthHistory = history.filter(h => h.date.startsWith(currentMonth));

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

async function handleSaveSession(index, btn) {
  const history = await getHistory();
  const todaySessions = history.filter(h => h.date === getTodayDateString());
  const session = todaySessions[index];
  if (!session) return;

  const inVal = document.getElementById(`edit-in-${index}`).value;
  const outVal = document.getElementById(`edit-out-${index}`).value;
  if (!inVal || !outVal) return;

  const origText = btn.textContent;
  btn.textContent = 'Wait...';
  btn.disabled = true;

  const date = session.date;
  const checkInTime = new Date(`${date}T${inVal}:00`).toISOString();
  const checkOutTime = new Date(`${date}T${outVal}:00`).toISOString();
  const durationMs = Math.max(0, new Date(checkOutTime) - new Date(checkInTime));

  await updateSession(session.id, { checkInTime, checkOutTime, durationMs });
  showToast('Session updated', 'success');
  await updateDisplay();
}

async function handleCheckIn() {
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
  showToast('Checked in successfully!', 'success');
  await updateDisplay();
}

async function handleCheckOut() {
  const session = getActiveSession();
  if (!session || session.checkOutTime) return;

  const btnOut = document.getElementById('btn-checkout');
  btnOut.textContent = 'Wait...';
  btnOut.disabled = true;

  const checkOutTime = new Date().toISOString();
  const durationMs = Math.max(0, new Date(checkOutTime) - new Date(session.checkInTime));

  await saveSession({
    date: session.date,
    checkInTime: session.checkInTime,
    checkOutTime: checkOutTime,
    durationMs
  });

  localStorage.removeItem(STORAGE_KEY_CURRENT);
  showToast(`Checked out! Worked for ${formatDuration(durationMs)}`, 'info');
  await updateDisplay();
}

document.addEventListener('DOMContentLoaded', async () => {
  supabase = await initSupabase();

  const btnIn = document.getElementById('btn-checkin');
  const btnOut = document.getElementById('btn-checkout');
  const tabToday = document.getElementById('tab-today');
  const tabMonth = document.getElementById('tab-month');

  if (btnIn) btnIn.addEventListener('click', handleCheckIn);
  if (btnOut) btnOut.addEventListener('click', handleCheckOut);

  if (tabToday) {
    tabToday.addEventListener('click', async () => {
      currentView = 'today';
      tabToday.classList.add('active');
      tabMonth.classList.remove('active');
      await renderHistory();
    });
  }

  if (tabMonth) {
    tabMonth.addEventListener('click', async () => {
      currentView = 'month';
      tabMonth.classList.add('active');
      tabToday.classList.remove('active');
      await renderHistory();
    });
  }

  await updateDisplay();
});
