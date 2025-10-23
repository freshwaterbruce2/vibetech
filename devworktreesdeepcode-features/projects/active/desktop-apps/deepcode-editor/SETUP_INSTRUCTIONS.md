# 🚀 DeepCode Editor Setup Instructions

## Quick Start

### 1. Add Your DeepSeek API Key

There are two ways to add your API key:

#### Option A: Through the UI (Recommended)

1. Launch the app with `npm run dev`
2. Click the **⚙️ Settings** button in the top right
3. Enter your DeepSeek API key (starts with `sk-...`)
4. Click **Save**

#### Option B: Through Environment File

1. Open `.env` file in the project root
2. Replace `your_actual_api_key_here` with your actual API key:
   ```
   VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
   ```
3. Restart the development server

### 2. Get Your API Key

- Visit https://platform.deepseek.com
- Sign up or log in
- Navigate to API Keys section
- Create a new API key

### 3. Start Development

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev

# The app will open at http://localhost:3001
```

## Features Available

### ✅ Core Features Working

- **Monaco Editor**: Full VS Code editing experience
- **File Management**: Create and manage multiple files
- **AI Chat**: Chat interface ready for AI integration
- **Settings Dialog**: Configure API key and preferences
- **Syntax Highlighting**: Support for multiple languages
- **Dark Theme**: Professional VS Code-inspired interface

### 🔧 With API Key Connected

Once you add your DeepSeek API key, you'll have access to:

- Real-time AI code suggestions
- Intelligent code completion
- AI-powered chat assistance
- Code explanation and debugging help
- Code generation from natural language

## Troubleshooting

### App Not Loading?

1. Check console for errors: Open browser DevTools (F12)
2. Ensure all dependencies are installed: `npm install`
3. Try clearing browser cache and refreshing

### API Key Not Working?

1. Verify the key starts with `sk-`
2. Check for extra spaces or quotes
3. Ensure you have API credits on platform.deepseek.com

### Port Already in Use?

If port 3001 is busy, you can change it in `vite.config.ts`:

```js
server: {
  port: 3002; // or any available port
}
```

## Next Steps

1. **Create a New File**: Click "New File" and start coding
2. **Open AI Chat**: Click "💬 AI Chat" button to get assistance
3. **Ask Questions**: Type questions about your code in the chat
4. **Get Suggestions**: AI will provide code suggestions and explanations

## Support

- **DeepSeek API Documentation**: https://platform.deepseek.com/docs
- **Report Issues**: Create an issue in the GitHub repository
- **Community**: Join the DeepSeek developer community

---

Happy coding with AI assistance! 🎯
