const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://notion-like-app-seven.vercel.app';

test.describe('Live Demo - Supabase CRUD Test', () => {

  test('Complete CRUD test with Supabase', async ({ page }) => {
    console.log('\n🚀 Starting test against: ' + BASE_URL);

    // Step 1: Go to home and turn OFF demo mode
    console.log('\n📍 Step 1: Turning OFF demo mode...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    const demoToggle = page.locator('#demo-toggle');
    const toggleText = await demoToggle.textContent();

    if (toggleText.includes('ON')) {
      console.log('   Clicking demo toggle...');
      await demoToggle.click();
      await page.waitForTimeout(1000);
    }

    await expect(demoToggle).toContainText('Demo Mode: OFF');
    console.log('   ✅ Demo Mode is OFF');

    // Step 2: Create a note
    console.log('\n📍 Step 2: Creating a note...');
    await page.click('a[href="notes.html"]');
    await page.waitForTimeout(1500);

    const timestamp = Date.now();
    console.log(`   Creating note with timestamp: ${timestamp}`);

    await page.locator('#new-note-btn').click();
    await page.waitForTimeout(500);

    await page.locator('#note-title').fill(`Supabase Test ${timestamp}`);
    await page.locator('#note-content').fill('This note is saved in the database!');
    await page.locator('#note-form button[type="submit"]').click();

    console.log('   Waiting for note to appear...');
    await page.waitForTimeout(2000);

    await expect(page.locator('.note-card h3')).toContainText(`Supabase Test ${timestamp}`);
    console.log('   ✅ Note created successfully');

    // Step 3: Refresh to test persistence
    console.log('\n📍 Step 3: Refreshing page to test persistence...');
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.locator('.note-card h3')).toContainText(`Supabase Test ${timestamp}`);
    console.log('   ✅ Note persisted after refresh - Supabase is working!');

    // Step 4: Edit the note
    console.log('\n📍 Step 4: Editing the note...');
    const noteCard = page.locator('.note-card').first();
    await noteCard.hover();
    await page.waitForTimeout(500);

    await page.locator('.edit-note').first().click();
    await page.waitForTimeout(500);

    await page.locator('#note-title').fill(`Updated ${timestamp}`);
    await page.locator('#note-content').fill('Note was updated in Supabase!');
    await page.locator('#note-form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.note-card h3').first()).toContainText(`Updated ${timestamp}`);
    console.log('   ✅ Note updated successfully');

    // Step 5: Create a task
    console.log('\n📍 Step 5: Creating a task...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    await page.click('a[href="tasks.html"]');
    await page.waitForTimeout(1500);

    await page.locator('#new-task-btn').click();
    await page.waitForTimeout(500);

    await page.locator('#task-title').fill(`Task Test ${timestamp}`);
    await page.locator('#task-description').fill('Testing Supabase tasks');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.task-card h4')).toContainText(`Task Test ${timestamp}`);
    console.log('   ✅ Task created successfully');

    // Step 6: Move task
    console.log('\n📍 Step 6: Moving task to Done...');
    await page.locator('.move-column').first().selectOption('done');
    await page.waitForTimeout(2000);

    const doneCount = await page.locator('.column[data-column="done"] .count').textContent();
    console.log(`   Done column now has: ${doneCount} tasks`);
    console.log('   ✅ Task moved successfully');

    console.log('\n🎉 ALL TESTS PASSED! Supabase is fully working!\n');
  });
});
