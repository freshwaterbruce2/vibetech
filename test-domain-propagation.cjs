const { chromium } = require('playwright');

async function testDomainPropagation() {
  console.log('🌐 Testing DNS propagation for vibe-tech.org');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const domains = [
    'https://vibe-tech.org',
    'https://www.vibe-tech.org'
  ];
  
  for (const domain of domains) {
    console.log(`\n📍 Testing: ${domain}`);
    
    try {
      const response = await page.goto(domain, { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      if (response && response.ok()) {
        console.log(`✅ ${domain} - LIVE! (Status: ${response.status()})`);
        const title = await page.title();
        console.log(`   📄 Title: "${title}"`);
      } else {
        const status = response ? response.status() : 'No response';
        console.log(`⏳ ${domain} - Not ready yet (Status: ${status})`);
      }
      
    } catch (error) {
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        console.log(`⏳ ${domain} - DNS still propagating...`);
      } else if (error.message.includes('timeout')) {
        console.log(`⏳ ${domain} - Timeout (might be propagating)`);
      } else {
        console.log(`⏳ ${domain} - ${error.message}`);
      }
    }
  }
  
  await browser.close();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('- If both domains show as LIVE: 🎉 CONGRATULATIONS! Your site is live!');
  console.log('- If still propagating: Wait 5-10 more minutes and test again');
  console.log('- Test manually: Visit https://vibe-tech.org in your browser');
}

testDomainPropagation();