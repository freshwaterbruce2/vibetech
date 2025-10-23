// Digital Content Builder - Main Application JavaScript
// API integration for AI-powered content creation

const API_BASE = 'http://localhost:5555/api';

// Authentication State
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// API Service
class ApiService {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Temporarily skip auth for testing
        // if (authToken) {
        //     headers['Authorization'] = `Bearer ${authToken}`;
        // }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

const api = new ApiService();

// Authentication Functions
async function register(email, password, name) {
    try {
        const result = await api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
        });

        if (result.token) {
            authToken = result.token;
            localStorage.setItem('authToken', authToken);
            currentUser = result.user;
        }

        return result;
    } catch (error) {
        showNotification(`Registration failed: ${error.message}`, 'error');
        throw error;
    }
}

async function login(email, password) {
    try {
        const result = await api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.token) {
            authToken = result.token;
            localStorage.setItem('authToken', authToken);
            currentUser = result.user;
        }

        return result;
    } catch (error) {
        showNotification(`Login failed: ${error.message}`, 'error');
        throw error;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showNotification('Logged out successfully');
}

// Content Generation Functions
async function generateContent(prompt, builderType) {
    try {
        showLoader(true);

        const result = await api.request('/deepseek/chat', {
            method: 'POST',
            body: JSON.stringify({
                prompt: prompt,
                builderType: builderType,
                stream: false
            })
        });

        showLoader(false);
        return result.content || result.message || result;
    } catch (error) {
        showLoader(false);
        showNotification(`Generation failed: ${error.message}`, 'error');
        throw error;
    }
}

// Builder-specific functions
const builders = {
    ebook: {
        generate: async function(topic, chapters, style) {
            const prompt = `Create an ebook outline and first chapter about "${topic}" with ${chapters} chapters in ${style} style. Include chapter titles, key points, and engaging content.`;
            const content = await generateContent(prompt, 'ebook');
            return formatEbookContent(content);
        }
    },

    course: {
        generate: async function(subject, level, modules) {
            const prompt = `Create a comprehensive course curriculum for "${subject}" at ${level} level with ${modules} modules. Include learning objectives, lesson plans, and assignments.`;
            const content = await generateContent(prompt, 'course');
            return formatCourseContent(content);
        }
    },

    landing: {
        generate: async function(product, audience, goal) {
            const prompt = `Create compelling landing page copy for "${product}" targeting ${audience} with the goal of ${goal}. Include headline, benefits, features, testimonials structure, and CTA.`;
            const content = await generateContent(prompt, 'landing');
            return formatLandingContent(content);
        }
    },

    email: {
        generate: async function(purpose, tone, audience) {
            const prompt = `Create an email template for ${purpose} in a ${tone} tone targeting ${audience}. Include subject line, preview text, body content, and CTA.`;
            const content = await generateContent(prompt, 'email');
            return formatEmailContent(content);
        }
    },

    social: {
        generate: async function(platform, topic, posts) {
            const prompt = `Create ${posts} social media posts for ${platform} about "${topic}". Include captions, hashtags, and engagement hooks.`;
            const content = await generateContent(prompt, 'social');
            return formatSocialContent(content);
        }
    },

    app: {
        generate: async function(appType, features, platform) {
            const prompt = `Create a detailed app prototype specification for a ${appType} app with features: ${features} for ${platform}. Include screens, user flows, and UI elements.`;
            const content = await generateContent(prompt, 'app');
            return formatAppContent(content);
        }
    }
};

// Content Formatting Functions
function formatEbookContent(content) {
    return `
        <div class="generated-content ebook-content">
            <h2>Generated Ebook Content</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('ebook', this.parentElement.parentElement)">Download as PDF</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('ebook', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

function formatCourseContent(content) {
    return `
        <div class="generated-content course-content">
            <h2>Generated Course Curriculum</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('course', this.parentElement.parentElement)">Export Course</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('course', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

function formatLandingContent(content) {
    return `
        <div class="generated-content landing-content">
            <h2>Generated Landing Page Copy</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('landing', this.parentElement.parentElement)">Export HTML</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('landing', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

function formatEmailContent(content) {
    return `
        <div class="generated-content email-content">
            <h2>Generated Email Template</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('email', this.parentElement.parentElement)">Export Template</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('email', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

function formatSocialContent(content) {
    return `
        <div class="generated-content social-content">
            <h2>Generated Social Media Posts</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('social', this.parentElement.parentElement)">Export Posts</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('social', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

function formatAppContent(content) {
    return `
        <div class="generated-content app-content">
            <h2>Generated App Prototype</h2>
            <div class="content-body">${content}</div>
            <div class="actions">
                <button onclick="downloadContent('app', this.parentElement.parentElement)">Export Spec</button>
                <button onclick="copyContent(this.parentElement.parentElement)">Copy to Clipboard</button>
                <button onclick="saveProject('app', this.parentElement.parentElement)">Save Project</button>
            </div>
        </div>
    `;
}

// UI Helper Functions
function showLoader(show) {
    const existingLoader = document.getElementById('loader');
    if (show && !existingLoader) {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: white; padding: 2rem; border-radius: 10px; text-align: center;">
                    <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Generating content with AI...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    } else if (!show && existingLoader) {
        existingLoader.remove();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f56565' : '#48bb78'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export Functions
function downloadContent(type, container) {
    const content = container.querySelector('.content-body').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Content downloaded successfully!');
}

function copyContent(container) {
    const content = container.querySelector('.content-body').innerText;
    navigator.clipboard.writeText(content).then(() => {
        showNotification('Content copied to clipboard!');
    }).catch(() => {
        showNotification('Failed to copy content', 'error');
    });
}

async function saveProject(type, container) {
    const content = container.querySelector('.content-body').innerHTML;
    try {
        const result = await api.request('/projects/save', {
            method: 'POST',
            body: JSON.stringify({
                type: type,
                content: content,
                timestamp: new Date().toISOString()
            })
        });
        showNotification('Project saved successfully!');
    } catch (error) {
        showNotification('Failed to save project', 'error');
    }
}

// Modal Functions
function showBuilderModal(builderType) {
    const modalHTML = getModalHTML(builderType);
    const modal = document.createElement('div');
    modal.id = 'builder-modal';
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('builder-modal');
    if (modal) modal.remove();
}

function getModalHTML(type) {
    const modalConfigs = {
        ebook: {
            title: 'Ebook Builder',
            fields: [
                { name: 'topic', label: 'Topic', type: 'text', placeholder: 'Enter your ebook topic' },
                { name: 'chapters', label: 'Number of Chapters', type: 'number', placeholder: '10' },
                { name: 'style', label: 'Writing Style', type: 'select', options: ['Professional', 'Casual', 'Academic', 'Creative'] }
            ]
        },
        course: {
            title: 'Course Builder',
            fields: [
                { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Enter course subject' },
                { name: 'level', label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
                { name: 'modules', label: 'Number of Modules', type: 'number', placeholder: '8' }
            ]
        },
        landing: {
            title: 'Landing Page Builder',
            fields: [
                { name: 'product', label: 'Product/Service', type: 'text', placeholder: 'Enter product name' },
                { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Small businesses' },
                { name: 'goal', label: 'Primary Goal', type: 'select', options: ['Sales', 'Signups', 'Downloads', 'Inquiries'] }
            ]
        },
        email: {
            title: 'Email Template Builder',
            fields: [
                { name: 'purpose', label: 'Purpose', type: 'select', options: ['Newsletter', 'Promotional', 'Welcome', 'Transactional'] },
                { name: 'tone', label: 'Tone', type: 'select', options: ['Formal', 'Friendly', 'Persuasive', 'Informative'] },
                { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Subscribers' }
            ]
        },
        social: {
            title: 'Social Media Builder',
            fields: [
                { name: 'platform', label: 'Platform', type: 'select', options: ['Twitter', 'LinkedIn', 'Instagram', 'Facebook'] },
                { name: 'topic', label: 'Topic', type: 'text', placeholder: 'Enter post topic' },
                { name: 'posts', label: 'Number of Posts', type: 'number', placeholder: '5' }
            ]
        },
        app: {
            title: 'App Prototype Builder',
            fields: [
                { name: 'appType', label: 'App Type', type: 'text', placeholder: 'e.g., E-commerce, Social' },
                { name: 'features', label: 'Key Features', type: 'text', placeholder: 'List main features' },
                { name: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'Web', 'Cross-platform'] }
            ]
        }
    };

    const config = modalConfigs[type];
    const fieldsHTML = config.fields.map(field => {
        if (field.type === 'select') {
            return `
                <div class="form-group">
                    <label for="${field.name}">${field.label}</label>
                    <select id="${field.name}" name="${field.name}" required>
                        ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>
            `;
        }
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}</label>
                <input type="${field.type}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" required>
            </div>
        `;
    }).join('');

    return `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h2>${config.title}</h2>
                <form id="${type}-form" onsubmit="handleBuilderSubmit(event, '${type}')">
                    ${fieldsHTML}
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Generate Content</button>
                    </div>
                </form>
                <div id="result-container"></div>
            </div>
        </div>
        <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: 15px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            }
            .form-group {
                margin-bottom: 1.5rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            .form-group input, .form-group select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
            }
            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 2rem;
            }
            .btn-primary, .btn-secondary {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 600;
            }
            .btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            .btn-secondary {
                background: #e2e8f0;
                color: #4a5568;
            }
            .generated-content {
                margin-top: 2rem;
                padding: 1.5rem;
                background: #f7fafc;
                border-radius: 10px;
            }
            .content-body {
                margin: 1rem 0;
                padding: 1rem;
                background: white;
                border-radius: 8px;
                max-height: 300px;
                overflow-y: auto;
                white-space: pre-wrap;
            }
            .actions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            .actions button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                background: #667eea;
                color: white;
                cursor: pointer;
            }
        </style>
    `;
}

async function handleBuilderSubmit(event, type) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    try {
        const builder = builders[type];
        const params = Object.values(values);
        const result = await builder.generate(...params);

        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = result;

    } catch (error) {
        showNotification(`Generation failed: ${error.message}`, 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    if (authToken) {
        // Verify token is still valid
        api.request('/auth/verify').catch(() => {
            logout();
        });
    }

    console.log('Digital Content Builder initialized with full functionality');
});

// Export for use in HTML
window.builders = builders;
window.showBuilderModal = showBuilderModal;
window.closeModal = closeModal;
window.handleBuilderSubmit = handleBuilderSubmit;
window.downloadContent = downloadContent;
window.copyContent = copyContent;
window.saveProject = saveProject;
window.login = login;
window.register = register;
window.logout = logout;
window.generateContent = generateContent;
window.api = api;

// Debug logging
console.log('App.js loaded successfully');
console.log('Available functions:', {
    showBuilderModal: typeof showBuilderModal,
    builders: typeof builders,
    generateContent: typeof generateContent,
    api: typeof api
});