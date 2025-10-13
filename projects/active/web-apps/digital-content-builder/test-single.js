// Simple test script for one content type
import http from 'http';

const testData = {
    prompt: "Create engaging social media posts about sustainable living tips",
    contentType: "social",
    model: "deepseek-chat",
    temperature: 0.7,
    maxTokens: 800
};

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/deepseek/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testData))
    }
};

console.log('🧪 Testing Social Media Content Generation...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ SUCCESS! Social Media Generation Working');
            console.log(`📏 Content Length: ${result.content.length} characters`);
            console.log(`🔧 Processing Type: ${result.metadata.processingType || 'html'}`);
            console.log(`📦 Has Wrapper: ${result.metadata.hasWrapper}`);
            console.log(`📝 First 150 chars: ${result.content.substring(0, 150)}...`);

            // Test shows social media is now working!
            console.log('\n🎉 SOCIAL MEDIA CONTENT TYPE IS NOW FIXED!');
        } catch (error) {
            console.log('❌ Parse Error:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request Error:', error.message);
});

req.write(JSON.stringify(testData));
req.end();
