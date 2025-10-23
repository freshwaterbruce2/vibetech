// VibeTech NOVA AI Assistant - Main Application
class NovaApp {
    constructor() {
        this.API_BASE = 'http://localhost:4000';
        this.isConnected = false;
        this.conversationHistory = [];
        this.init();
    }

    // Safe element selector with null checks
    safeSelector(selector, parent = document) {
        const element = parent.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    }

    // Initialize the application
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    // Main app setup
    setupApp() {
        this.bindEvents();
        this.checkStatus();
        this.setupStatusMonitoring();
        console.log('🚀 VibeTech NOVA AI Assistant initialized');
    }

    // Bind all event listeners safely
    bindEvents() {
        // Send button
        const sendBtn = this.safeSelector('#sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input
        const messageInput = this.safeSelector('#messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
            messageInput.addEventListener('input', () => this.handleInputChange());
        }

        // Quick action buttons (created dynamically)
        setTimeout(() => this.setupQuickActions(), 1000);
    }

    // Handle keyboard input
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    // Handle input changes for typing indicators
    handleInputChange() {
        const messageInput = this.safeSelector('#messageInput');
        if (messageInput) {
            // Add visual feedback for typing
            messageInput.classList.toggle('vt-input-typing', messageInput.value.trim().length > 0);
        }
    }

    // Setup quick action buttons
    setupQuickActions() {
        const container = this.safeSelector('.container');
        if (!container) return;

        const quickActionsHTML = `
            <div class="vt-quick-actions" style="margin-top: 1rem; text-align: center;">
                <h4 class="vt-text-gradient" style="margin-bottom: 0.5rem;">Quick Actions</h4>
                <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                    <button id="testPluginsBtn" class="vt-btn vt-btn-ghost">🌤️ Weather</button>
                    <button id="testCodeBtn" class="vt-btn vt-btn-ghost">💻 Code</button>
                    <button id="testBasicBtn" class="vt-btn vt-btn-ghost">🤖 Chat</button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', quickActionsHTML);

        // Safely bind quick action events
        this.bindQuickActions();
    }

    // Bind quick action buttons
    bindQuickActions() {
        const actions = [
            { id: 'testPluginsBtn', action: () => this.quickTest('Show me current weather in London') },
            { id: 'testCodeBtn', action: () => this.quickTest('Execute JavaScript: console.log("Hello VibeTech!");') },
            { id: 'testBasicBtn', action: () => this.quickTest('Hello NOVA! What makes VibeTech special?') }
        ];

        actions.forEach(({ id, action }) => {
            const btn = this.safeSelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', action);
            }
        });
    }

    // Quick test helper
    quickTest(message) {
        const messageInput = this.safeSelector('#messageInput');
        if (messageInput) {
            messageInput.value = message;
            this.sendMessage();
        }
    }

    // Check system status
    async checkStatus() {
        try {
            // Check plugins
            const pluginResponse = await this.apiCall('/plugins');
            const pluginData = await pluginResponse.json();

            this.updateStatus('pluginCount', `${pluginData.enabled}/${pluginData.total} Active`);
            this.updateStatus('serverStatus', 'Online', 'online');
            this.updateStatus('memoryCount', 'Available', 'online');

            this.isConnected = true;
        } catch (error) {
            console.error('Status check failed:', error);
            this.updateStatus('serverStatus', 'Offline', 'offline');
            this.updateStatus('pluginCount', 'N/A', 'offline');
            this.updateStatus('memoryCount', 'N/A', 'offline');
            this.isConnected = false;
        }
    }

    // Update status display
    updateStatus(elementId, text, status = null) {
        const element = this.safeSelector(`#${elementId}`);
        if (element) {
            element.textContent = text;

            // Add status classes
            if (status) {
                element.className = `vt-status vt-status-${status}`;
                if (status === 'online') {
                    element.innerHTML = `<div class="vt-pulse-dot" style="background: currentColor;"></div>${text}`;
                }
            }
        }
    }

    // Setup status monitoring
    setupStatusMonitoring() {
        setInterval(() => this.checkStatus(), 30000); // Check every 30 seconds
    }

    // Send message to NOVA
    async sendMessage() {
        const messageInput = this.safeSelector('#messageInput');
        const chatMessages = this.safeSelector('#chatMessages');
        const sendBtn = this.safeSelector('#sendBtn');

        if (!messageInput || !chatMessages || !sendBtn) {
            console.error('Required elements not found');
            return;
        }

        const message = messageInput.value.trim();
        if (!message) return;

        // Disable input during processing
        this.setInputState(false, 'Sending...');

        // Add user message
        this.addMessage(message, 'user');
        messageInput.value = '';

        // Add thinking indicator
        const thinkingId = this.addMessage('Thinking...', 'nova', true);

        try {
            const response = await this.apiCall('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Remove thinking indicator
            this.removeMessage(thinkingId);

            // Add NOVA response
            let responseText = data.content || data.response || data.message || 'Response received but format unclear.';

            // Add metadata if available
            if (data.memories?.length > 0) {
                responseText += `\n\n📚 Using ${data.memories.length} memories`;
            }
            if (data.confidence) {
                responseText += `\n🎯 Confidence: ${Math.round(data.confidence * 100)}%`;
            }

            this.addMessage(responseText, 'nova');
            this.conversationHistory.push({ user: message, nova: responseText });

        } catch (error) {
            console.error('Send message error:', error);
            this.removeMessage(thinkingId);
            this.addMessage(`❌ Error: ${error.message}. Please check if the server is running.`, 'error');
        } finally {
            this.setInputState(true, 'Send');
        }
    }

    // Add message to chat
    addMessage(content, type = 'nova', isTemporary = false) {
        const chatMessages = this.safeSelector('#chatMessages');
        if (!chatMessages) return null;

        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `vt-message vt-message-${type}`;

        const icon = {
            user: '👤',
            nova: '🤖',
            error: '❌'
        }[type] || '🤖';

        messageDiv.innerHTML = `
            <div class="vt-message-header">
                <span class="vt-message-icon">${icon}</span>
                <strong>${type === 'user' ? 'You' : type === 'nova' ? 'NOVA' : 'System'}</strong>
                ${isTemporary ? '<div class="vt-loading"></div>' : ''}
            </div>
            <div class="vt-message-content">${this.formatMessage(content)}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return messageId;
    }

    // Remove message by ID
    removeMessage(messageId) {
        if (messageId) {
            const message = document.getElementById(messageId);
            if (message) {
                message.remove();
            }
        }
    }

    // Format message content
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Set input state
    setInputState(enabled, buttonText) {
        const messageInput = this.safeSelector('#messageInput');
        const sendBtn = this.safeSelector('#sendBtn');

        if (messageInput) {
            messageInput.disabled = !enabled;
        }

        if (sendBtn) {
            sendBtn.disabled = !enabled;
            sendBtn.textContent = buttonText;
            if (enabled) {
                sendBtn.classList.remove('vt-btn-loading');
            } else {
                sendBtn.classList.add('vt-btn-loading');
            }
        }
    }

    // API call helper
    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        return fetch(url, { ...defaultOptions, ...options });
    }
}

// Initialize the app
window.novaApp = new NovaApp();