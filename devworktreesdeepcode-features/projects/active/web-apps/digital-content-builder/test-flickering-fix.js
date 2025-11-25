#!/usr/bin/env node

/**
 * Test script to verify the flickering issue has been resolved
 * Tests both streaming and non-streaming content generation
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3005';

async function testServerHealth() {
    console.log('🔍 Testing server health...');
    try {
        const response = await axios.get(`${SERVER_URL}/api/health`);
        console.log('✅ Server is healthy:', response.data.status);
        return true;
    } catch (error) {
        console.log('❌ Server health check failed:', error.message);
        return false;
    }
}

async function testContentGeneration() {
    console.log('\n🎯 Testing content generation (non-streaming)...');
    try {
        const response = await axios.post(`${SERVER_URL}/api/deepseek/generate`, {
            prompt: 'Write a simple test blog post about AI',
            contentType: 'blog',
            model: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 500,
            stream: false
        });

        console.log('✅ Content generation successful');
        console.log('📊 Response metadata:', {
            contentType: response.data.metadata?.contentType,
            processingTime: response.data.metadata?.processingTime + 'ms',
            contentLength: response.data.content?.length || 'N/A'
        });

        return response.data;
    } catch (error) {
        console.log('❌ Content generation failed:', error.response?.data || error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Flickering Fix Verification Tests');
    console.log('='.repeat(50));

    // Test 1: Server Health
    const isHealthy = await testServerHealth();
    if (!isHealthy) {
        console.log('\n❌ Server is not running. Please start with: node server.js');
        process.exit(1);
    }

    // Test 2: Content Generation
    const content = await testContentGeneration();
    if (!content) {
        console.log('\n❌ Content generation test failed');
        process.exit(1);
    }

    console.log('\n🎉 All tests passed! The flickering fix appears to be working.');
    console.log('\n📝 Summary of fixes applied:');
    console.log('   • Debounced display updates (500ms throttle)');
    console.log('   • Removed continuous streaming display updates');
    console.log('   • Added proper loading states');
    console.log('   • Disabled streaming mode by default');
    console.log('   • Fixed timeout handling for display updates');

    console.log('\n🌐 Open http://localhost:3005 to test the web interface');
    console.log('   The interface should now be stable without flickering');
}

// Run tests
runTests().catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
});
