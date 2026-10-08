const { test, expect } = require('@playwright/test');

// Test against the live Vercel deployment
const BASE_URL = 'https://notion-like-app-seven.vercel.app';

test.describe('Live Deployment Tests - Supabase Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto(BASE_URL);

    // Turn OFF demo mode to use Supabase
    const demoToggle = page.locator('#demo-toggle');
    const toggleText = await demoToggle.textContent();

    if (toggleText.includes('ON')) {
      await demoToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have demo mode OFF', async ({ page }) => {
    await page.goto(BASE_URL);
    const demoToggle = page.locator('#demo-toggle');

    // Click if ON
    const toggleText = await demoToggle.textContent();
    if (toggleText.includes('ON')) {
      await demoToggle.click();
      await page.waitForTimeout(500);
    }

    await expect(demoToggle).toContainText('Demo Mode: OFF');
  });

  test('Notes: CREATE - should create a note in Supabase', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1000);

    const timestamp = Date.now();

    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);

    await page.locator('#note-title').fill(`Test Note ${timestamp}`);
    await page.locator('#note-content').fill('This note is saved in Supabase database');
    await page.locator('#note-form button[type="submit"]').click();

    // Wait for toast
    await page.waitForTimeout(1000);

    // Verify note appears
    await expect(page.locator('.note-card h3')).toContainText(`Test Note ${timestamp}`);
  });

  test('Notes: READ - should load notes from Supabase', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1500);

    // Check if notes are loaded (either empty state or note cards)
    const hasNotes = await page.locator('.note-card').count() > 0;
    const hasEmptyState = await page.locator('.empty-state').isVisible();

    expect(hasNotes || hasEmptyState).toBeTruthy();
  });

  test('Notes: UPDATE - should update note in Supabase', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1000);

    // Create a note first
    const timestamp = Date.now();
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill(`Original ${timestamp}`);
    await page.locator('#note-content').fill('Original content');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Edit the note
    const noteCard = page.locator('.note-card').first();
    await noteCard.hover();
    await page.locator('.edit-note').first().click();
    await page.waitForTimeout(300);

    await page.locator('#note-title').fill(`Updated ${timestamp}`);
    await page.locator('#note-content').fill('Updated content from Supabase');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify update
    await expect(page.locator('.note-card h3').first()).toContainText(`Updated ${timestamp}`);
  });

  test('Notes: DELETE - should delete note from Supabase', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1000);

    // Create a note to delete
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill('Note to Delete');
    await page.locator('#note-content').fill('Will be deleted');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const initialCount = await page.locator('.note-card').count();

    // Delete it
    const noteCard = page.locator('.note-card').first();
    await noteCard.hover();

    page.on('dialog', dialog => dialog.accept());
    await page.locator('.delete-note').first().click();
    await page.waitForTimeout(1000);

    const finalCount = await page.locator('.note-card').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('Notes: PERSISTENCE - data persists after refresh', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1000);

    // Create a unique note
    const uniqueId = Date.now();
    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#note-title').fill(`Persist Test ${uniqueId}`);
    await page.locator('#note-content').fill('Should survive refresh');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(1500);

    // Verify note is still there
    await expect(page.locator('.note-card h3')).toContainText(`Persist Test ${uniqueId}`);
  });

  test('Tasks: CREATE - should create task in Supabase', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks.html`);
    await page.waitForTimeout(1000);

    const timestamp = Date.now();

    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);

    await page.locator('#task-title').fill(`Test Task ${timestamp}`);
    await page.locator('#task-description').fill('Supabase task test');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify task appears
    await expect(page.locator('.task-card h4')).toContainText(`Test Task ${timestamp}`);
  });

  test('Tasks: UPDATE - should move task between columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks.html`);
    await page.waitForTimeout(1000);

    // Create a task
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill('Move Test Task');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Move it to done
    await page.locator('.move-column').first().selectOption('done');
    await page.waitForTimeout(1000);

    // Verify it moved
    const doneCount = await page.locator('.column[data-column="done"] .count').textContent();
    expect(parseInt(doneCount)).toBeGreaterThan(0);
  });

  test('Tasks: PERSISTENCE - data persists after refresh', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks.html`);
    await page.waitForTimeout(1000);

    // Create a unique task
    const uniqueId = Date.now();
    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#task-title').fill(`Persist Task ${uniqueId}`);
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(1500);

    // Verify task is still there
    await expect(page.locator('.task-card h4')).toContainText(`Persist Task ${uniqueId}`);
  });

  test('Search: Notes should filter results', async ({ page }) => {
    await page.goto(`${BASE_URL}/notes.html`);
    await page.waitForTimeout(1500);

    const noteCount = await page.locator('.note-card').count();

    if (noteCount > 0) {
      // Search for non-existent term
      await page.locator('#search-notes').fill('xyznonexistent123');
      await page.waitForTimeout(300);

      const filteredCount = await page.locator('.note-card').count();
      expect(filteredCount).toBe(0);
    }
  });

  test('Search: Tasks should filter results', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks.html`);
    await page.waitForTimeout(1500);

    const taskCount = await page.locator('.task-card').count();

    if (taskCount > 0) {
      // Search for non-existent term
      await page.locator('#search-tasks').fill('xyznonexistent123');
      await page.waitForTimeout(300);

      const filteredCount = await page.locator('.task-card').count();
      expect(filteredCount).toBe(0);
    }
  });
});
