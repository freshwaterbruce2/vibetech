const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('error', error => console.log('ERROR:', error.message));
    
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
    });
    
    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check what's actually rendered
    const content = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
            rootContent: root ? root.innerHTML.substring(0, 200) : 'No root element',
            title: document.title,
            bodyClasses: document.body.className,
            hasLoadingSpinner: !!document.querySelector('.loading-container'),
            errorMessages: Array.from(document.querySelectorAll('.error')).map(el => el.textContent)
        };
    });
    
    console.log('\nPage Analysis:', JSON.stringify(content, null, 2));
    
    await browser.close();
})();