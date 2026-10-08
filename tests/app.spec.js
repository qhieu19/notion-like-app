const { test, expect } = require('@playwright/test');

// Use local server instead of file:// protocol (ES6 modules require HTTP)
const BASE_URL = 'http://localhost:8888';
const getUrl = (filename) => `${BASE_URL}/${filename}`;

test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test
  await page.goto(getUrl('index.html'));
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('demo-mode', 'true');
  });
});

test.describe('Home Page', () => {
  test('loads home page and shows navigation options', async ({ page }) => {
    await page.goto(getUrl('index.html'));
    await expect(page).toHaveTitle('Personal Notion-like App');
    await expect(page.locator('h1')).toContainText('Personal Notion-like App');
    await expect(page.locator('.home-options')).toBeVisible();
    await expect(page.locator('.home-card').first()).toContainText('Notes');
    await expect(page.locator('.home-card').last()).toContainText('Tasks');
  });

  test('demo mode toggle works', async ({ page }) => {
    await page.goto(getUrl('index.html'));
    const demoToggle = page.locator('#demo-toggle');
    await expect(demoToggle).toContainText('Demo Mode: ON');
    await demoToggle.click();
    await expect(demoToggle).toContainText('Demo Mode: OFF');
    await demoToggle.click();
    await expect(demoToggle).toContainText('Demo Mode: ON');
  });
});

test.describe('Notes Page - Basic CRUD', () => {
  test('shows empty state before creating notes', async ({ page }) => {
    await page.goto(getUrl('notes.html'));
    await expect(page).toHaveTitle('Notes - Personal Notion-like App');
    await expect(page.locator('.empty-state')).toContainText('No notes yet');
  });

  test('can create a new note', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    // Click new note button
    await page.locator('#new-note-btn').click();

    // Wait for modal to appear
    await page.waitForTimeout(300);

    // Fill form
    await page.locator('#note-title').fill('My First Note');
    await page.locator('#note-content').fill('This is a test note.');
    await page.locator('#note-form button[type="submit"]').click();

    // Wait for toast and note to appear
    await page.waitForTimeout(500);
    await expect(page.locator('.note-card h3')).toContainText('My First Note');
    await expect(page.locator('.note-card p')).toContainText('This is a test note.');
  });

  test('can edit an existing note', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    // Create a note first
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Original Title');
    await page.locator('#note-content').fill('Original content.');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Hover over note card to reveal edit button
    const noteCard = page.locator('.note-card').first();
    await noteCard.hover();
    await page.locator('.edit-note').first().click();
    await page.waitForTimeout(300);

    // Verify modal shows edit mode
    await expect(page.locator('#note-modal h2')).toContainText('Edit Note');
    await expect(page.locator('#note-title')).toHaveValue('Original Title');

    // Edit the note
    await page.locator('#note-title').fill('Updated Title');
    await page.locator('#note-content').fill('Updated content.');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Verify changes
    await expect(page.locator('.note-card h3')).toContainText('Updated Title');
    await expect(page.locator('.note-card p')).toContainText('Updated content.');
  });

  test('can delete a note', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    // Create a note first
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Note to Delete');
    await page.locator('#note-content').fill('This will be deleted.');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Hover and click delete
    const noteCard = page.locator('.note-card').first();
    await noteCard.hover();

    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await page.locator('.delete-note').first().click();

    // Wait and verify note is gone
    await page.waitForTimeout(500);
    await expect(page.locator('.note-card')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toContainText('No notes yet');
  });

  test('can view note in detail modal', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    const longContent = 'This is a very long note content. '.repeat(10);

    // Create a note
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Detailed Note');
    await page.locator('#note-content').fill(longContent);
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Click on note content to open detail view
    await page.locator('.note-card-content').first().click();
    await page.waitForTimeout(300);

    // Verify detail modal opens
    await expect(page.locator('.detail-title')).toContainText('Detailed Note');
    await expect(page.locator('.detail-content')).toContainText(longContent);
  });
});

test.describe('Notes Page - Search', () => {
  test('can search notes by title', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    // Create multiple notes
    for (let i = 1; i <= 3; i++) {
      await page.locator('#new-note-btn').click();
      await page.waitForTimeout(300);
      await page.locator('#note-title').fill(`Note ${i}`);
      await page.locator('#note-content').fill(`Content for note ${i}`);
      await page.locator('#note-form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // Should show all notes
    await expect(page.locator('.note-card')).toHaveCount(3);

    // Search for specific note
    await page.locator('#search-notes').fill('Note 2');
    await page.waitForTimeout(300);
    await expect(page.locator('.note-card')).toHaveCount(1);
    await expect(page.locator('.note-card h3')).toContainText('Note 2');
  });

  test('shows empty state when no results match', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    // Create a note
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Test Note');
    await page.locator('#note-content').fill('Some content');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Search for non-existent content
    await page.locator('#search-notes').fill('nonexistent');
    await page.waitForTimeout(300);
    await expect(page.locator('.note-card')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toContainText('No notes match');
  });
});

test.describe('Tasks Page - Basic CRUD', () => {
  test('shows task board with columns', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));
    await expect(page).toHaveTitle('Tasks - Personal Notion-like App');
    await expect(page.locator('.column[data-column="backlog"]')).toBeVisible();
    await expect(page.locator('.column[data-column="todo"]')).toBeVisible();
    await expect(page.locator('.column[data-column="in-progress"]')).toBeVisible();
    await expect(page.locator('.column[data-column="done"]')).toBeVisible();
  });

  test('can create a new task', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Implement feature');
    await page.locator('#task-description').fill('Create the new feature.');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-column').selectOption('todo');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    const card = page.locator('.task-card').first();
    await expect(card.locator('h4')).toContainText('Implement feature');
    await expect(card.locator('.priority.high')).toContainText('high');
  });

  test('can edit an existing task', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    // Create a task
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Original Task');
    await page.locator('#task-description').fill('Original description');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Edit the task
    const taskCard = page.locator('.task-card').first();
    await taskCard.hover();
    await page.locator('.edit-task').first().click();
    await page.waitForTimeout(300);

    await expect(page.locator('#task-modal h2')).toContainText('Edit Task');
    await expect(page.locator('#task-title')).toHaveValue('Original Task');

    await page.locator('#task-title').fill('Updated Task');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.task-card h4').first()).toContainText('Updated Task');
    await expect(page.locator('.priority.high').first()).toBeVisible();
  });

  test('can delete a task', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    // Create a task
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Task to Delete');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Delete it
    const taskCard = page.locator('.task-card').first();
    await taskCard.hover();

    page.on('dialog', dialog => dialog.accept());
    await page.locator('.delete-task').first().click();

    await page.waitForTimeout(500);
    await expect(page.locator('.task-card')).toHaveCount(0);
  });

  test('can move task between columns', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    // Create a task
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Move me');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.column[data-column="todo"] .count')).toContainText('1');

    // Move task to done
    await page.locator('.move-column').first().selectOption('done');
    await page.waitForTimeout(700);

    await expect(page.locator('.column[data-column="done"] .count')).toContainText('1');
    await expect(page.locator('.column[data-column="todo"] .count')).toContainText('0');
  });
});

test.describe('Tasks Page - Search', () => {
  test('can search tasks by title', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    // Create multiple tasks
    for (let i = 1; i <= 3; i++) {
      await page.locator('#new-task-btn').click();
      await page.waitForTimeout(300);
      await page.locator('#task-title').fill(`Task ${i}`);
      await page.locator('#task-form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('.task-card')).toHaveCount(3);

    // Search for specific task
    await page.locator('#search-tasks').fill('Task 2');
    await page.waitForTimeout(300);
    await expect(page.locator('.task-card')).toHaveCount(1);
    await expect(page.locator('.task-card h4')).toContainText('Task 2');
  });
});

test.describe('Navigation', () => {
  test('home page links to notes and tasks', async ({ page }) => {
    await page.goto(getUrl('index.html'));

    // Click notes link
    await page.click('a[href="notes.html"]');
    await expect(page.locator('h1')).toContainText('My Notes');

    // Go back and click tasks link
    await page.goto(getUrl('index.html'));
    await page.click('a[href="tasks.html"]');
    await expect(page.locator('h1')).toContainText('Task Board');
  });

  test('notes page has back to home link', async ({ page }) => {
    await page.goto(getUrl('notes.html'));
    await expect(page.locator('.back-link')).toBeVisible();
    await expect(page.locator('.back-link')).toContainText('Home');
  });

  test('tasks page has back to home link', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));
    await expect(page.locator('.back-link')).toBeVisible();
    await expect(page.locator('.back-link')).toContainText('Home');
  });
});

test.describe('Toast Notifications', () => {
  test('shows success toast when creating a note', async ({ page }) => {
    await page.goto(getUrl('notes.html'));

    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Test Note');
    await page.locator('#note-content').fill('Content');
    await page.locator('#note-form button[type="submit"]').click();

    // Wait for toast to appear
    await page.waitForSelector('.toast-success', { timeout: 2000 });
    await expect(page.locator('.toast-success')).toContainText('Note created');
  });

  test('shows success toast when moving task', async ({ page }) => {
    await page.goto(getUrl('tasks.html'));

    // Create a task
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Task to move');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Move it
    await page.locator('.move-column').first().selectOption('done');

    await page.waitForSelector('.toast-success', { timeout: 2000 });
    await expect(page.locator(".toast-success").last()).toContainText("Task moved");
  });
});

test.describe('Responsiveness', () => {
  test('notes page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(getUrl('notes.html'));

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#new-note-btn')).toBeVisible();
    await expect(page.locator('#search-notes')).toBeVisible();
  });

  test('tasks page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(getUrl('tasks.html'));

    await expect(page.locator('.column').first()).toBeVisible();
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#task-modal')).toBeVisible();
  });
});
