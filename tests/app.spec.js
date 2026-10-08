const { test, expect } = require('@playwright/test');

test.describe('Home Page', () => {
  test('loads home page and shows navigation options', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/index.html');
    await expect(page).toHaveTitle('Personal Notion-like App');
    await expect(page.locator('h1')).toContainText('Personal Notion-like App');
    await expect(page.locator('.home-options')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Notes');
    await expect(page.locator('h3')).toContainText('Tasks');
  });

  test('demo mode toggle works', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/index.html');
    const demoToggle = page.locator('#demo-toggle');
    await expect(demoToggle).toContainText('Demo Mode: ON');
    await demoToggle.click();
    await expect(demoToggle).toContainText('Demo Mode: OFF');
    await demoToggle.click();
    await expect(demoToggle).toContainText('Demo Mode: ON');
  });
});

test.describe('Notes Page', () => {
  test('shows empty state before creating notes', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await expect(page).toHaveTitle('Notes - Personal Notion-like App');
    await expect(page.locator('.empty-state')).toContainText('No notes yet');
  });

  test('can create a new note', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await page.locator('#new-note-btn').click();
    await expect(page.locator('#note-modal')).toBeVisible();
    await page.locator('#note-title').fill('My First Note');
    await page.locator('#note-content').fill('This is a test note.');
    await page.locator('#note-form button[type="submit"]').click();
    await expect(page.locator('#note-modal')).not.toBeVisible();
    await expect(page.locator('.note-card h3')).toContainText('My First Note');
    await expect(page.locator('.note-card p')).toContainText('This is a test note.');
  });

  test('prevents empty note submission', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await page.locator('#new-note-btn').click();
    await page.locator('#note-form button[type="submit"]').click();
    await expect(page.locator('#note-modal')).toBeVisible();
  });

  test('can cancel note creation', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await page.locator('#new-note-btn').click();
    await page.locator('#cancel-note').click();
    await expect(page.locator('#note-modal')).not.toBeVisible();
  });

  test('can close modal by clicking outside', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await page.locator('#new-note-btn').click();
    await page.locator('main').click();
    await expect(page.locator('#note-modal')).not.toBeVisible();
  });
});

test.describe('Tasks Page', () => {
  test('shows task board with columns', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await expect(page).toHaveTitle('Tasks - Personal Notion-like App');
    await expect(page.locator('.column[data-column="backlog"]')).toBeVisible();
    await expect(page.locator('.column[data-column="todo"]')).toBeVisible();
    await expect(page.locator('.column[data-column="in-progress"]')).toBeVisible();
    await expect(page.locator('.column[data-column="done"]')).toBeVisible();
    await expect(page.locator('.column[data-column="backlog"] h2')).toContainText('Backlog');
    await expect(page.locator('.column[data-column="todo"] h2')).toContainText('To Do');
    await expect(page.locator('.column[data-column="in-progress"] h2')).toContainText('In Progress');
    await expect(page.locator('.column[data-column="done"] h2')).toContainText('Done');
  });

  test('shows empty state counts', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await expect(page.locator('.count')).toHaveText(['0', '0', '0', '0']);
  });

  test('can create a new task', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await page.locator('#new-task-btn').click();
    await expect(page.locator('#task-modal')).toBeVisible();
    await page.locator('#task-title').fill('Implement notes feature');
    await page.locator('#task-description').fill('Create the notes page.');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-column').selectOption('todo');
    await page.locator('#task-form button[type="submit"]').click();
    await expect(page.locator('#task-modal')).not.toBeVisible();
    const card = page.locator('.task-card h4').first();
    await expect(card).toContainText('Implement notes feature');
    await expect(card.locator('p')).toContainText('Create the notes page.');
    await expect(card.locator('.priority.high')).toContainText('high');
    await expect(page.locator('.column[data-column="todo"] .count')).toContainText('1');
  });

  test('default task is created in To Do with medium priority', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await page.locator('#new-task-btn').click();
    await page.locator('#task-title').fill('Quick task');
    await page.locator('#task-form button[type="submit"]').click();
    await expect(page.locator('.column[data-column="todo"] h2')).toContainText('To Do');
    await expect(page.locator('.task-card .priority.medium')).toBeVisible();
  });

  test('can move task between columns', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    // Create a task
    await page.locator('#new-task-btn').click();
    await page.locator('#task-title').fill('Move me');
    await page.locator('#task-form button[type="submit"]').click();
    await expect(page.locator('.column[data-column="todo"] .count')).toContainText('1');
    // Move task from Todo to Done
    const taskCard = page.locator('.task-card').first();
    await taskCard.hover();
    await page.locator('.move-column').first().selectOption('done');
    await expect(page.locator('.column[data-column="done"] .count')).toContainText('1');
    await expect(page.locator('.column[data-column="todo"] .count')).toContainText('0');
  });

  test('can cancel task creation', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await page.locator('#new-task-btn').click();
    await page.locator('#cancel-task').click();
    await expect(page.locator('#task-modal')).not.toBeVisible();
  });

  test('prevents empty task submission', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    await page.locator('#new-task-btn').click();
    await page.locator('#task-form button[type="submit"]').click();
    await expect(page.locator('#task-modal')).toBeVisible();
  });
});

test.describe('Responsiveness', () => {
  test('notes page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/notes.html');
    await page.locator('#new-note-btn').click();
    const modal = page.locator('#note-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('form')).toBeVisible();
  });

  test('tasks page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/tasks.html');
    const columns = page.locator('.column');
    await expect(columns.count()).res.toEqual(4);
    await page.locator('#new-task-btn').click();
    const modal = page.locator('#task-modal');
    await expect(modal).toBeVisible();
  });

  test('home page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/index.html');
    await expect(page.locator('.home-options')).toBeVisible();
    await expect(page.locator('.home-card')).toHaveCount(2);
  });
});

test.describe('Navigation', () => {
  test('home page links to notes page', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/index.html');
    const notesLink = page.locator('a[href="notes.html"]');
    await expect(notesLink).toBeVisible();
    await page.click('a[href="notes.html"]');
    await expect(page.locator('h1')).toContainText('My Notes');
  });

  test('home page links to tasks page', async ({ page }) => {
    await page.goto('file:///Users/hieu19/GIT/untitled%20folder%202/index.html');
    const tasksLink = page.locator('a[href="tasks.html"]');
    await expect(tasksLink).toBeVisible();
    await page.click('a[href="tasks.html"]');
    await expect(page.locator('h1')).toContainText('Task Board');
  });
});
