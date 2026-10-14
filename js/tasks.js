// js/tasks.js - Solarized Tasks Manager with Supabase backend
import { initSupabase } from './main.js';

let supabase = null;
let tasks = [];
let view = { name: 'home' };

const STATUS = {
  todo:  { label: 'To do',       hint: 'Việc cần làm', color: 'var(--blue)',   db: 'todo' },
  doing: { label: 'In progress', hint: 'Đang làm',     color: 'var(--yellow)', db: 'in-progress' },
  done:  { label: 'Done',        hint: 'Đã xong',      color: 'var(--green)',  db: 'done' }
};
const DB_TO_STATUS = { 'todo': 'todo', 'in-progress': 'doing', 'done': 'done', 'backlog': 'todo' };

const ORDER = ['todo', 'doing', 'done'];
const MOVE = {
  todo:  { to: 'doing', label: 'Bắt đầu' },
  doing: { to: 'done',  label: 'Hoàn thành' },
  done:  { to: 'doing', label: 'Mở lại' }
};

const PRIORITY_MAP = { 1: 'low', 2: 'medium', 3: 'high' };
const DB_PRIORITY = { 'low': 1, 'medium': 2, 'high': 3 };
const PRIORITY = {
  1: { label: 'Thấp', color: 'var(--cyan)' },
  2: { label: 'Vừa',  color: 'var(--yellow)' },
  3: { label: 'Cao',  color: 'var(--red)' }
};

const ICON = {
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};

const $ = (s) => document.querySelector(s);
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function isoOffset(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function fmtDay(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
}

function dueInfo(t) {
  if (!t.due) return null;
  const today = isoOffset(0), p = t.due.split('-'), short = p[2] + '/' + p[1];
  const overdue = t.due < today && t.status !== 'done';
  const text = overdue ? 'Quá hạn ' + short
    : t.due === today ? 'Hạn hôm nay'
    : t.due === isoOffset(1) ? 'Hạn ngày mai'
    : 'Hạn ' + short;
  return { text, overdue };
}

// ponytail: pack due date into description header to avoid schema alteration on Supabase
function unpackTask(dbRow) {
  let due = '';
  let desc = dbRow.description || '';
  const match = desc.match(/^\[due:(\d{4}-\d{2}-\d{2})\]\n?/);
  if (match) {
    due = match[1];
    desc = desc.slice(match[0].length);
  }
  return {
    id: dbRow.id,
    title: dbRow.title,
    desc,
    status: DB_TO_STATUS[dbRow.status] || 'todo',
    priority: DB_PRIORITY[dbRow.priority] || 2,
    due,
    created: new Date(dbRow.created_at).getTime(),
    updated: new Date(dbRow.updated_at || dbRow.created_at).getTime()
  };
}

function packPayload(draft) {
  const desc = draft.due ? `[due:${draft.due}]\n${draft.desc || ''}` : (draft.desc || '');
  const dbStatus = STATUS[draft.status]?.db || 'todo';
  return {
    title: draft.title.trim(),
    description: desc,
    status: dbStatus,
    priority: PRIORITY_MAP[draft.priority] || 'medium',
    task_column: dbStatus,
    updated_at: new Date().toISOString()
  };
}

async function loadFromDB() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    tasks = (data || []).map(unpackTask);
    render(false);
  } catch (err) {
    console.error('Failed to load tasks', err);
    toast('Không tải được task từ máy chủ');
  }
}

function sorted(status) {
  const list = tasks.filter((t) => t.status === status);
  if (status === 'done') return list.sort((a, b) => b.updated - a.updated);
  return list.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (a.due !== b.due) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return a.created - b.created;
  });
}
function count(status) { return tasks.filter((t) => t.status === status).length; }

/* ---------- Views ---------- */
function topbar() {
  const addBtn = '<button class="btn primary add-top" data-action="new-task">' + ICON.plus + '<span><span class="lbl-long">Thêm </span>task</span></button>';

  if (view.name === 'home') {
    const raw = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
    const d = raw.charAt(0).toUpperCase() + raw.slice(1);
    return '<header class="topbar is-home">' +
      '<a href="index.html" class="btn" title="Về trang chủ">' + ICON.back + 'Trang chủ</a>' +
      '<div class="topbar-date">' + esc(d) + '</div>' +
      addBtn + '</header>';
  }
  const s = STATUS[view.status];
  let crumbs = '<li><button class="crumb-link" data-action="go-home">Tổng quan</button><span class="sep" aria-hidden="true">' + ICON.chev + '</span></li>';
  if (view.name === 'list') {
    crumbs += '<li><span class="crumb-current" aria-current="page">' + s.label + '</span></li>';
  } else {
    crumbs += '<li><button class="crumb-link" data-action="open-list" data-status="' + view.status + '">' + s.label + '</button><span class="sep" aria-hidden="true">' + ICON.chev + '</span></li>' +
      '<li><span class="crumb-current" aria-current="page">' + (view.id ? 'Chi tiết' : 'Task mới') + '</span></li>';
  }
  return '<header class="topbar"><button class="btn" data-action="back">' + ICON.back + 'Quay lại</button>' +
    '<nav aria-label="Điều hướng"><ol class="crumbs">' + crumbs + '</ol></nav><div class="spacer"></div>' +
    (view.name === 'list' ? addBtn.replace('add-top', 'add-list') : '') + '</header>';
}

function tile2(s) {
  const meta = STATUS[s], list = sorted(s), cap = s === 'todo' ? 4 : 8;
  const head = '<div class="tile-head"><span class="dot"></span><h2>' + meta.label + '</h2><span class="count">' + list.length + '</span>' + ICON.chev + '</div>';
  let body = '';
  if (s !== 'done') {
    body = list.length ? '<ul class="cards">' + list.slice(0, cap).map((t) => {
      const di = dueInfo(t), od = di && di.overdue;
      return '<li class="card' + (od ? ' overdue' : '') + '" style="--pc:' + PRIORITY[t.priority].color + '"><span class="card-title">' + esc(t.title) + '</span>' + (od ? '<span class="sr">Quá hạn</span>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="empty-mini">Chưa có task nào.</p>';
  }
  return '<article class="tile ' + s + '" data-status="' + s + '" style="--c:' + meta.color + ';view-transition-name:tile-' + s + '">' + head + body +
    '<button class="tile-hit" data-action="open-list" data-status="' + s + '" aria-label="Mở danh sách ' + meta.label + ', ' + list.length + ' task"></button></article>';
}

function homeScreen() {
  return '<section class="home" aria-label="Tổng quan task">' + ORDER.map(tile2).join('') + '</section>';
}

function listScreen() {
  const s = view.status, meta = STATUS[s], list = sorted(s), mv = MOVE[s];
  const tabs = ORDER.map((k) => (
    '<button class="tab" style="--tc:' + STATUS[k].color + '" data-action="open-list" data-status="' + k + '"' +
    (k === s ? ' aria-current="page"' : '') + '>' + STATUS[k].label + ' <span class="n">' + count(k) + '</span></button>'
  )).join('');
  const rows = list.map((t) => {
    const di = dueInfo(t);
    const actionBtns = s === 'doing'
      ? '<div class="quick-group">' +
          '<button class="quick" style="--qc:var(--blue);" data-action="move" data-id="' + t.id + '" data-to="todo" aria-label="Về To do: ' + esc(t.title) + '">To do</button>' +
          '<button class="quick" style="--qc:var(--green);" data-action="move" data-id="' + t.id + '" data-to="done" aria-label="Hoàn thành: ' + esc(t.title) + '">Hoàn thành</button>' +
        '</div>'
      : '<button class="quick" data-action="move" data-id="' + t.id + '" data-to="' + mv.to + '" aria-label="' + mv.label + ': ' + esc(t.title) + '">' + mv.label + '</button>';

    return '<li class="row' + (s === 'done' ? ' is-done' : '') + '" style="--pc:' + PRIORITY[t.priority].color + ';--qc:' + STATUS[mv.to].color + '">' +
      '<button class="row-open" data-action="open-task" data-id="' + t.id + '"><div class="row-main"><div class="row-title">' + esc(t.title) + '</div>' +
      '<div class="row-meta"><span class="chip">Ưu tiên ' + PRIORITY[t.priority].label.toLowerCase() + '</span>' +
      (di ? '<span class="due' + (di.overdue ? ' overdue' : '') + '">' + esc(di.text) + '</span>' : '') + '</div></div>' + ICON.chev + '</button>' +
      actionBtns + '</li>';
  }).join('');
  const empty = '<div class="empty"><p>Chưa có task nào trong ' + meta.label + '.</p><button class="btn primary" data-action="new-task">' + ICON.plus + 'Thêm task</button></div>';
  return '<section class="panel" style="--c:' + meta.color + ';view-transition-name:tile-' + s + '">' +
    '<div class="panel-head"><span class="dot" style="background:' + meta.color + '"></span><h2>' + meta.label + '</h2><span class="count">' + list.length + '</span><span class="hint">' + meta.hint + '</span></div>' +
    '<div class="tabs" role="group" aria-label="Chuyển danh sách">' + tabs + '</div>' +
    (list.length ? '<ul class="rows">' + rows + '</ul>' : empty) + '</section>';
}

function detailScreen() {
  const d = view.draft, c = STATUS[d.status].color;
  const statusSeg = ORDER.map((k) => (
    '<button type="button" style="--sc:' + STATUS[k].color + '" data-action="set-status" data-value="' + k + '" aria-pressed="' + (d.status === k) + '">' + STATUS[k].label + '</button>'
  )).join('');
  const prioSeg = [1, 2, 3].map((k) => (
    '<button type="button" style="--sc:' + PRIORITY[k].color + '" data-action="set-priority" data-value="' + k + '" aria-pressed="' + (d.priority === k) + '">' + PRIORITY[k].label + '</button>'
  )).join('');
  const t = view.id ? tasks.find((x) => x.id === view.id) : null;
  return '<section class="panel" id="detail" style="--c:' + c + '">' +
    '<div class="panel-head"><h2>' + (view.id ? 'Chi tiết task' : 'Task mới') + '</h2><span class="badge" id="dirty" hidden>Chưa lưu</span></div>' +
    '<label class="field"><span>Tiêu đề</span><input type="text" id="f-title" maxlength="140" autocomplete="off" placeholder="Bạn cần làm gì?"></label>' +
    '<p class="err" id="err" hidden>Nhập tiêu đề để lưu task.</p>' +
    '<label class="field"><span>Mô tả</span><textarea id="f-desc" placeholder="Ghi chú, các bước, đường dẫn…"></textarea></label>' +
    '<fieldset><legend>Trạng thái</legend><div class="seg" id="seg-status">' + statusSeg + '</div></fieldset>' +
    '<fieldset><legend>Mức ưu tiên</legend><div class="seg" id="seg-prio">' + prioSeg + '</div></fieldset>' +
    '<label class="field"><span>Hạn hoàn thành</span><input type="date" id="f-due"></label>' +
    (t ? '<p class="meta"><span>Tạo ngày ' + fmtDay(t.created) + '</span><span>Cập nhật ngày ' + fmtDay(t.updated) + '</span></p>' : '') +
    '<div class="form-actions"><button class="btn primary" data-action="save">Lưu thay đổi</button>' +
    '<button class="btn" data-action="back">Huỷ</button><span class="spacer"></span>' +
    (view.id ? '<button class="btn danger" data-action="delete" id="btn-del">Xoá task</button>' : '') + '</div></section>';
}

function render(focusMain) {
  const body = view.name === 'home' ? homeScreen() : view.name === 'list' ? listScreen() : detailScreen();
  $('#shell').innerHTML = topbar() + '<main class="screen' + (view.name === 'list' ? ' has-fab' : view.name === 'home' ? ' is-home' : '') + '" tabindex="-1">' + body + '</main>' +
    (view.name === 'list' ? '<button class="fab" data-action="new-task" aria-label="Thêm task vào ' + STATUS[view.status].label + '">' + ICON.plus + '<span>Thêm task</span></button>' : '');
  if (view.name === 'detail') {
    $('#f-title').value = view.draft.title;
    $('#f-desc').value = view.draft.desc;
    $('#f-due').value = view.draft.due;
    markDirty();
    if (focusMain && !view.id) $('#f-title').focus({ preventScroll: true });
  }
  if (focusMain) {
    window.scrollTo(0, 0);
    if (!(view.name === 'detail' && !view.id)) $('.screen').focus({ preventScroll: true });
  }
}

function go(v) {
  const apply = () => { view = v; render(true); };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

function draftOf(t) {
  return { title: t.title, desc: t.desc, status: t.status, priority: t.priority, due: t.due };
}
function markDirty() {
  const el = $('#dirty');
  if (!el) return;
  el.hidden = JSON.stringify(view.draft) === JSON.stringify(view.orig);
}
function openTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  go({ name: 'detail', status: t.status, id: t.id, draft: draftOf(t), orig: draftOf(t) });
}
function newTask(status) {
  const d = { title: '', desc: '', status, priority: 2, due: '' };
  go({ name: 'detail', status, id: null, draft: d, orig: Object.assign({}, d) });
}

async function saveTask() {
  const d = view.draft, title = d.title.trim();
  if (!title) {
    $('#err').hidden = false;
    $('#f-title').focus();
    return;
  }
  const payload = packPayload(d);
  try {
    if (view.id) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', view.id);
      if (error) throw error;
      const t = tasks.find((x) => x.id === view.id);
      if (t) Object.assign(t, { title, desc: d.desc, status: d.status, priority: d.priority, due: d.due, updated: Date.now() });
      toast('Đã lưu thay đổi');
    } else {
      const { data, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error) throw error;
      if (data) tasks.unshift(unpackTask(data));
      toast('Đã tạo task mới');
    }
    go({ name: 'list', status: d.status });
  } catch (err) {
    console.error('Failed to save task', err);
    toast('Lỗi khi lưu task');
  }
}

async function deleteTask(id) {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    tasks = tasks.filter((x) => x.id !== id);
    toast('Đã xoá');
    go({ name: 'list', status: view.status });
  } catch (err) {
    console.error('Failed to delete task', err);
    toast('Lỗi khi xoá task');
  }
}

async function quickMove(id, nextStatus) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  const prevStatus = t.status;
  t.status = nextStatus;
  t.updated = Date.now();
  render(false);
  try {
    const dbStatus = STATUS[nextStatus]?.db || 'todo';
    const { error } = await supabase.from('tasks').update({
      status: dbStatus,
      task_column: dbStatus,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
    toast('Đã chuyển sang ' + STATUS[nextStatus].label);
  } catch (err) {
    console.error('Failed to move task', err);
    t.status = prevStatus;
    render(false);
    toast('Lỗi khi chuyển trạng thái');
  }
}

function pressSeg(groupSel, value) {
  document.querySelectorAll(groupSel + ' button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.value === String(value)));
  });
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

let delTimer;
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;

  if (a === 'go-home') return go({ name: 'home' });
  if (a === 'open-list') return go({ name: 'list', status: el.dataset.status });
  if (a === 'open-task') return openTask(el.dataset.id);
  if (a === 'new-task') return newTask(view.name === 'list' ? view.status : 'todo');
  if (a === 'back') return go(view.name === 'detail' ? { name: 'list', status: view.status } : { name: 'home' });
  if (a === 'move') return quickMove(el.dataset.id, el.dataset.to);

  if (a === 'set-status') {
    view.draft.status = el.dataset.value;
    pressSeg('#seg-status', el.dataset.value);
    $('#detail')?.style.setProperty('--c', STATUS[view.draft.status].color);
    return markDirty();
  }
  if (a === 'set-priority') {
    view.draft.priority = Number(el.dataset.value);
    pressSeg('#seg-prio', el.dataset.value);
    return markDirty();
  }
  if (a === 'save') return saveTask();
  if (a === 'delete') {
    if (!el.classList.contains('armed')) {
      el.classList.add('armed');
      el.textContent = 'Bấm lần nữa để xoá';
      clearTimeout(delTimer);
      delTimer = setTimeout(() => {
        el.classList.remove('armed');
        el.textContent = 'Xoá task';
      }, 3000);
      return;
    }
    return deleteTask(view.id);
  }
});

// Smooth cross-page transition
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link || link.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
  const targetUrl = new URL(link.href, window.location.href);
  if (targetUrl.origin !== window.location.origin) return;

  if (document.startViewTransition) {
    e.preventDefault();
    document.startViewTransition(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.16s ease';
    });
    setTimeout(() => {
      window.location.href = targetUrl.href;
    }, 150);
  }
});

document.addEventListener('input', (e) => {
  if (view.name !== 'detail') return;
  const id = e.target.id;
  if (id === 'f-title') {
    view.draft.title = e.target.value;
    const err = $('#err');
    if (err) err.hidden = true;
  } else if (id === 'f-desc') {
    view.draft.desc = e.target.value;
  } else if (id === 'f-due') {
    view.draft.due = e.target.value;
  } else {
    return;
  }
  markDirty();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'f-title') {
    e.preventDefault();
    saveTask();
  }
});

// Self-check assert: verifies packing and unpacking logic preserves task data
function _assertCheck() {
  const sample = { title: 'T', desc: 'desc', status: 'doing', priority: 3, due: '2026-10-20' };
  const packed = packPayload(sample);
  if (packed.status !== 'in-progress' || packed.priority !== 'high' || !packed.description.startsWith('[due:2026-10-20]')) {
    console.error('Self-check assertion failed: packPayload');
  }
  const unpacked = unpackTask({ id: '1', title: packed.title, description: packed.description, status: packed.status, priority: packed.priority, created_at: new Date().toISOString() });
  if (unpacked.due !== '2026-10-20' || unpacked.desc !== 'desc' || unpacked.status !== 'doing' || unpacked.priority !== 3) {
    console.error('Self-check assertion failed: unpackTask');
  }
}
_assertCheck();

document.addEventListener('DOMContentLoaded', async () => {
  render(false);
  supabase = await initSupabase();
  await loadFromDB();
});
