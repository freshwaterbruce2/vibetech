const playwright = require('playwright');

(async () => {
  console.log('🚀 Starting Phase 2 Verification Tests...\n');

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
  });

  try {
    // Navigate to app
    console.log('📱 Opening app at http://localhost:3007...');
    await page.goto('http://localhost:3007', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_screenshots/01_initial_load.png' });
    console.log('✅ App loaded\n');

    // TEST 1: Task Persistence
    console.log('='.repeat(60));
    console.log('TEST 1: Task Persistence (Permission Fix)');
    console.log('='.repeat(60));

    // Open Agent Mode with keyboard shortcut Ctrl+Shift+A
    console.log('Opening Agent Mode with Ctrl+Shift+A...');
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_screenshots/02_agent_mode_opened.png' });
    console.log('✅ Agent Mode opened');

    // Look for Agent tab and click it
    const agentTab = await page.locator('button, div').filter({ hasText: /^agent$/i }).first();
    if (await agentTab.count() > 0) {
      await agentTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Switched to Agent tab');
    }

    // Find task input
    const taskInput = await page.locator('textarea').first();
    await taskInput.fill('Create a file called test.txt with content hello world');
    await page.waitForTimeout(500);
    console.log('✅ Task entered');

    // Click Plan Task
    const planBtn = await page.locator('button').filter({ hasText: /plan/i }).first();
    if (await planBtn.count() > 0) {
      await planBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test_screenshots/03_task_planned.png' });
      console.log('✅ Task planned');

      // Click Execute Task
      const execBtn = await page.locator('button').filter({ hasText: /execute/i }).first();
      if (await execBtn.count() > 0) {
        await execBtn.click();
        await page.waitForTimeout(8000);
        await page.screenshot({ path: 'test_screenshots/04_test1_executed.png' });
        console.log('✅ Task executed');

        // Analyze logs
        const forbiddenErrors = consoleLogs.filter(log => log.includes('forbidden path'));
        const persistenceLogs = consoleLogs.filter(log => log.includes('TaskPersistence') || log.includes('Task saved'));

        console.log(`\nFound ${consoleLogs.length} total console logs`);
        console.log(`Found ${persistenceLogs.length} persistence logs`);
        console.log(`Found ${forbiddenErrors.length} forbidden path errors`);

        if (forbiddenErrors.length > 0) {
          console.log('❌ TEST 1 FAILED: Forbidden path errors found');
          forbiddenErrors.slice(0, 3).forEach(err => console.log('  ', err));
        } else {
          console.log('✅ TEST 1 PASSED: No forbidden path errors');
          if (persistenceLogs.length > 0) {
            console.log('✅ Task persistence working:');
            persistenceLogs.slice(0, 3).forEach(log => console.log('  ', log));
          }
        }

        // TEST 2: Self-Correction
        console.log('\n' + '='.repeat(60));
        console.log('TEST 2: File Not Found (Self-Correction)');
        console.log('='.repeat(60));

        consoleLogs.length = 0;
        await page.waitForTimeout(2000);

        // New task
        const newTaskBtn = await page.locator('button').filter({ hasText: /new task/i }).first();
        if (await newTaskBtn.count() > 0) {
          await newTaskBtn.click();
          await page.waitForTimeout(1000);
          console.log('✅ New task started');
        }

        // Enter failing task
        const taskInput2 = await page.locator('textarea').first();
        await taskInput2.fill('Read the file at C:/totally/fake/nonexistent/missing.txt');
        await page.waitForTimeout(500);
        console.log('✅ Failing task entered');

        // Plan and execute
        await page.locator('button').filter({ hasText: /plan/i }).first().click();
        await page.waitForTimeout(3000);
        await page.locator('button').filter({ hasText: /execute/i }).first().click();
        console.log('⏳ Executing and waiting for self-correction...');
        await page.waitForTimeout(12000);
        await page.screenshot({ path: 'test_screenshots/05_test2_self_correction.png' });

        // Analyze self-correction
        const selfCorrectionLogs = consoleLogs.filter(log =>
          log.toLowerCase().includes('self-correction') ||
          log.toLowerCase().includes('self-correcting')
        );
        const alternativeLogs = consoleLogs.filter(log =>
          log.includes('Alternative Strategy') ||
          log.includes('alternative')
        );
        const retryLogs = consoleLogs.filter(log => log.includes('retry') || log.includes('attempt'));

        console.log(`\nFound ${selfCorrectionLogs.length} self-correction logs`);
        console.log(`Found ${alternativeLogs.length} alternative strategy logs`);
        console.log(`Found ${retryLogs.length} retry/attempt logs`);

        if (selfCorrectionLogs.length > 0) {
          console.log('✅ TEST 2 PASSED: Self-correction triggered');
          selfCorrectionLogs.slice(0, 5).forEach(log => console.log('  ', log));
          if (alternativeLogs.length > 0) {
            console.log('✅ Alternative strategies generated:');
            alternativeLogs.slice(0, 3).forEach(log => console.log('  ', log));
          }
        } else {
          console.log('⚠️  TEST 2: No explicit self-correction logs found');
          console.log('Retry/attempt logs:');
          retryLogs.slice(0, 5).forEach(log => console.log('  ', log));
        }
      }
    }

    // Print logs for analysis
    console.log('\n' + '='.repeat(60));
    console.log('RECENT CONSOLE LOGS (last 30):');
    console.log('='.repeat(60));
    consoleLogs.slice(-30).forEach((log, i) => console.log(`${i + 1}. ${log}`));

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('\n✅ Tests complete. Screenshots saved to test_screenshots/');
  }
})();
