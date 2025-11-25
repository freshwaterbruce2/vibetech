/**
 * Simple Console Log Verification
 * Checks if the streaming mode fix was applied by reading console logs
 */

import puppeteer from 'puppeteer';

const DEV_SERVER_URL = 'http://localhost:3007';

async function verify() {
  console.log('🔍 Simple Verification - Checking Console Logs\n');
  console.log('═'.repeat(60));

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    console.log('📦 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`  [BROWSER] ${text}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      console.log(`  [ERROR] ${error.message}`);
    });

    console.log('🌐 Navigating to app...\n');

    try {
      await page.goto(DEV_SERVER_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (error) {
      console.error('❌ Failed to load page');
      console.error(`   Error: ${error}`);
      console.error(`\n   Is the dev server running on port 3007?`);
      process.exit(1);
    }

    console.log('✅ Page loaded, waiting for logs...\n');

    // Wait for app to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Verification Results\n');

    // Test 1: Provider initialized
    const providerInit = logs.some(log =>
      log.includes('[COMPLETION] InlineCompletionProvider initialized')
    );

    if (providerInit) {
      console.log('✅ Test 1: Provider Initialized');
      passed++;
    } else {
      console.log('❌ Test 1: Provider NOT initialized');
      failed++;
    }

    // Test 2: Streaming disabled (CRITICAL)
    const streamingDisabled = logs.some(log =>
      log.includes('streamingEnabled: false')
    );

    if (streamingDisabled) {
      console.log('✅ Test 2: Streaming Mode DISABLED (fix applied)');
      passed++;
    } else {
      const streamingEnabled = logs.some(log =>
        log.includes('streamingEnabled: true')
      );

      if (streamingEnabled) {
        console.log('❌ Test 2: Streaming Mode ENABLED (FIX NOT APPLIED!)');
        console.log('   Action: Clear cache and rebuild');
      } else {
        console.log('⚠️  Test 2: streamingEnabled log not found');
      }
      failed++;
    }

    // Test 3: Demo mode check
    const demoModeDisabled = logs.some(log =>
      log.includes('demo mode disabled') || log.includes('isDemoMode: false')
    );

    if (demoModeDisabled) {
      console.log('✅ Test 3: Demo Mode Disabled (API keys configured)');
      passed++;
    } else {
      console.log('⚠️  Test 3: Demo mode status unclear (might not be critical)');
    }

    // Test 4: Monaco configured
    const monacoConfigured = logs.some(log =>
      log.includes('Monaco Editor configured') || log.includes('Monaco Editor workers')
    );

    if (monacoConfigured) {
      console.log('✅ Test 4: Monaco Editor Configured');
      passed++;
    } else {
      console.log('❌ Test 4: Monaco configuration logs missing');
      failed++;
    }

    // Test 5: Activation message
    const activated = logs.some(log =>
      log.includes('AI Tab Completion activated')
    );

    if (activated) {
      console.log('✅ Test 5: Completion Activated');
      passed++;
    } else {
      console.log('❌ Test 5: Activation message not shown');
      failed++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed\n`);

    // Check critical test
    if (streamingDisabled) {
      console.log('🎉 CRITICAL FIX VERIFIED!');
      console.log('   streamingEnabled: false (correct)\n');
      console.log('Next step: Test actual completion in the Tauri app');
      console.log('  1. Open the Tauri window');
      console.log('  2. Type: function calculate');
      console.log('  3. Wait 500ms');
      console.log('  4. Look for gray ghost text\n');
    } else {
      console.log('❌ CRITICAL FIX NOT APPLIED');
      console.log('   streamingEnabled is still true or not found\n');
      console.log('Actions to fix:');
      console.log('  1. Stop dev server (Ctrl+C)');
      console.log('  2. Clear cache: rm -rf node_modules/.vite');
      console.log('  3. Restart: pnpm run dev\n');
      process.exit(1);
    }

    console.log('═'.repeat(60));

    // Show all captured logs
    if (logs.length > 0) {
      console.log('\n📋 All Console Logs:\n');
      logs.forEach(log => console.log(`   ${log}`));
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verify();
