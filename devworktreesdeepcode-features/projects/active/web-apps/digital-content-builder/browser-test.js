/**
 * Browser-based Content Type Tester
 * Run this in the browser console to test all content types
 */

const contentTypes = [
    'blog', 'landing', 'email', 'social', 'ebook', 'course', 'code', 'video', 'podcast'
];

const testPrompts = {
    blog: 'Write a short blog post about AI in healthcare',
    landing: 'Create a landing page for a fitness app',
    email: 'Design a welcome email for new customers',
    social: 'Create social media posts about sustainable living',
    ebook: 'Outline a chapter about digital marketing',
    course: 'Create a lesson about JavaScript basics',
    code: 'Document a React component for user authentication',
    video: 'Write a script for a 5-minute tech tutorial',
    podcast: 'Create show notes for a business podcast episode'
};

async function testContentType(type) {
    try {
        console.log(`🧪 Testing ${type.toUpperCase()}...`);

        const response = await fetch('/api/deepseek/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: testPrompts[type],
                contentType: type,
                model: type === 'code' ? 'deepseek-coder' : 'deepseek-chat',
                temperature: 0.7,
                maxTokens: 1000,
                stream: false
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ ${type.toUpperCase()} - SUCCESS`);
            console.log(`   Content length: ${result.content.length} characters`);
            console.log(`   Processing type: ${result.metadata.processingType || 'html'}`);
            console.log(`   Has wrapper: ${result.metadata.hasWrapper}`);
            console.log(`   First 100 chars: ${result.content.substring(0, 100)}...`);
            return true;
        } else {
            const errorData = await response.json();
            console.log(`❌ ${type.toUpperCase()} - FAILED: ${response.status} ${response.statusText}`);
            console.log(`   Error: ${errorData.error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${type.toUpperCase()} - ERROR: ${error.message}`);
        return false;
    }
}

async function runSystematicTest() {
    console.log('🔧 DIGITAL CONTENT BUILDER - SYSTEMATIC FEATURE TEST');
    console.log('=' * 60);
    console.log('Testing all content types after fixes...\n');

    const results = {};
    let passCount = 0;

    for (const type of contentTypes) {
        const passed = await testContentType(type);
        results[type] = passed;
        if (passed) passCount++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(''); // Add spacing
    }

    console.log('=' * 60);
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' * 60);

    console.log('\n✅ WORKING CONTENT TYPES:');
    Object.entries(results).forEach(([type, passed]) => {
        if (passed) {
            console.log(`  ✓ ${type.toUpperCase()}`);
        }
    });

    console.log('\n❌ BROKEN CONTENT TYPES:');
    Object.entries(results).forEach(([type, passed]) => {
        if (!passed) {
            console.log(`  ✗ ${type.toUpperCase()}`);
        }
    });

    const passRate = Math.round(passCount/contentTypes.length*100);
    console.log(`\n📈 OVERALL SUCCESS RATE: ${passCount}/${contentTypes.length} (${passRate}%)`);

    if (passCount === contentTypes.length) {
        console.log('\n🎉 ALL CONTENT TYPES ARE WORKING! SYSTEM IS PRODUCTION READY!');
        console.log('✅ No further fixes needed - all features functional');
    } else if (passCount >= 7) {
        console.log('\n🟡 MOST CONTENT TYPES WORKING - NEARLY PRODUCTION READY');
        console.log(`⚠️  ${contentTypes.length - passCount} content types need attention`);
    } else {
        console.log('\n🔴 SIGNIFICANT ISSUES REMAIN');
        console.log(`⚠️  ${contentTypes.length - passCount} content types still broken`);
    }

    return results;
}

// Make it available globally
window.runSystematicTest = runSystematicTest;
window.testContentType = testContentType;

console.log('🛠️ Content Type Tester Loaded!');
console.log('Run: runSystematicTest() to test all content types');
console.log('Run: testContentType("blog") to test individual types');
