# Nova Agent Web Interface

A modern React-based web interface for the Nova AI Assistant with full support for chat, project management, memory visualization, and more.

## Features

- **Real-time Chat Interface**: Interact with Nova AI assistant with a beautiful chat UI
- **Project Management**: Create and manage projects, track tasks, and organize your work
- **Memory System**: View and search through Nova's memory of your conversations and preferences
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing
- **Voice Input**: Use voice recognition to send messages (Chrome/Edge only)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Streaming Responses**: See Nova's responses as they're generated in real-time
- **Capabilities Management**: Enable/disable specific Nova features as needed

## Prerequisites

- Node.js 16+ and npm
- Nova Agent backend server running on port 3000

## Installation

1. Navigate to the nova-web directory:
```bash
cd nova-web
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Make sure the Nova Agent backend is running:
```bash
# In the nova-agent root directory
npm run dev:server
```

2. Start the web interface:
```bash
# In the nova-web directory
npm start
```

3. Open your browser to http://localhost:3006 (React development server)

## Configuration

The application automatically connects to the Nova backend at http://localhost:3000. This is configured via the proxy setting in package.json.

To change the backend URL, set the environment variable:
```bash
REACT_APP_API_URL=http://your-backend-url:port npm start
```

## Building for Production

To create an optimized production build:
```bash
npm run build
```

The build files will be in the `build/` directory.

## Key Technologies

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Styled Components**: CSS-in-JS styling solution
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Markdown**: Markdown rendering for AI responses

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Chat.tsx        # Main chat interface
│   ├── Header.tsx      # App header with controls
│   ├── Sidebar.tsx     # Project/memory sidebar
│   └── ...
├── contexts/           # React Context providers
│   ├── AppContext.tsx  # Global app state
│   └── ThemeContext.tsx # Theme management
├── pages/              # Route-based page components
├── services/           # API service layer
├── hooks/              # Custom React hooks
└── types.ts            # TypeScript type definitions
```

## Browser Support

- Chrome/Edge: Full support including voice recognition
- Firefox: Full support except voice recognition
- Safari: Full support except voice recognition
- Mobile browsers: Responsive design, voice support varies

## Troubleshooting

1. **Can't connect to backend**: Ensure Nova backend is running on port 3000
2. **Voice recognition not working**: Use Chrome or Edge browser
3. **Blank screen**: Check browser console for errors, ensure all dependencies are installed
4. **CORS errors**: The proxy configuration should handle this automatically

## Development

For development with hot reload:
```bash
npm start
```

For running tests:
```bash
npm test
```

For linting:
```bash
npm run lint
```