// Quick visual verification using Puppeteer
import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting visual verification...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    console.log('📡 Navigating to http://localhost:5185...');
    const response = await page.goto('http://localhost:5185', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log(`✓ HTTP Status: ${response.status()}`);

    // Check if Tailwind styles are applied
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        fontFamily: styles.fontFamily,
        margin: styles.margin,
        padding: styles.padding
      };
    });

    console.log('\n🎨 Body Styles:');
    console.log(`  Background: ${bodyStyles.backgroundColor}`);
    console.log(`  Font Family: ${bodyStyles.fontFamily}`);
    console.log(`  Margin: ${bodyStyles.margin}`);
    console.log(`  Padding: ${bodyStyles.padding}`);

    // Take screenshot
    await page.screenshot({
      path: 'tailwind-v3-visual-check.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved: tailwind-v3-visual-check.png');

    // Check for CSS errors
    if (errors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Check if content exists
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 0;
    });
    console.log(`✓ Page has content: ${hasContent}`);

    console.log('\n✅ Visual verification complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
})();
