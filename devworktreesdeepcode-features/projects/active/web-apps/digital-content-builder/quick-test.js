/**
 * Quick Content Type Tester
 * Tests each content type to verify fixes
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
        const response = await fetch('http://localhost:5556/api/deepseek/generate', {
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
            return true;
        } else {
            console.log(`❌ ${type.toUpperCase()} - FAILED: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${type.toUpperCase()} - ERROR: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🧪 TESTING ALL CONTENT TYPES');
    console.log('=' * 50);

    const results = {};
    let passCount = 0;

    for (const type of contentTypes) {
        console.log(`\nTesting ${type}...`);
        const passed = await testContentType(type);
        results[type] = passed;
        if (passed) passCount++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '=' * 50);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' * 50);

    Object.entries(results).forEach(([type, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${type.toUpperCase()}`);
    });

    console.log(`\n📈 PASS RATE: ${passCount}/${contentTypes.length} (${Math.round(passCount/contentTypes.length*100)}%)`);

    if (passCount === contentTypes.length) {
        console.log('\n🎉 ALL CONTENT TYPES ARE NOW WORKING!');
    } else {
        console.log(`\n⚠️  ${contentTypes.length - passCount} content types still need attention.`);
    }
}

// Run the tests
if (typeof window === 'undefined') {
    // Node.js environment
    runAllTests();
} else {
    // Browser environment
    window.runAllTests = runAllTests;
}
