# Broq AI Research Agent - Frontend

A professional, modern React frontend for the Broq AI Research Agent with a NotebookLM-inspired dark theme.

## Overview

This is the frontend application for the Broq AI Research Agent, a sophisticated AI-powered research platform that combines multiple research tools (ArXiv, Wikipedia, Tavily) with RAG (Retrieval-Augmented Generation) capabilities for comprehensive academic research.

## Features

### 🎨 Design
- **Professional Dark Theme**: Black, gray, and white color scheme inspired by NotebookLM
- **Responsive Layout**: Fully responsive design that works on desktop, tablet, and mobile
- **Smooth Animations**: Subtle fade-in and slide-up animations for a polished feel
- **Intuitive UI**: Clean, minimalist interface focused on productivity

### 💬 Chat Interface
- **Real-time Messaging**: Send and receive messages with AI research assistant
- **Message History**: View complete conversation history for each session
- **Auto-scrolling**: Messages automatically scroll to the latest content
- **Typing Indicators**: Visual feedback when the AI is processing requests

### 📚 Session Management
- **Multi-Session Support**: Create and manage multiple research sessions
- **Session History**: Quick access to previous research sessions from sidebar
- **Session Metadata**: Timestamps and auto-generated titles for easy identification
- **Delete Sessions**: Remove sessions you no longer need

### ⚡ Input Features
- **Smart Textarea**: Auto-expanding textarea that grows with your input
- **Keyboard Shortcuts**: Press Ctrl+Enter to send messages quickly
- **Context-Aware Hints**: Helpful prompts for new and ongoing sessions
- **Loading State**: Visual feedback during research processing

### 🏠 Welcome Screen
- **Feature Showcase**: Beautiful display of platform capabilities
- **Suggestion Pills**: Quick-start prompts for common research queries
- **Interactive Examples**: One-click exploration of research capabilities

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation and branding
│   │   ├── Header.css
│   │   ├── Sidebar.jsx         # Session list and navigation
│   │   ├── Sidebar.css
│   │   ├── ChatArea.jsx        # Main chat interface
│   │   ├── ChatArea.css
│   │   ├── Message.jsx         # Individual message component
│   │   ├── Message.css
│   │   ├── InputArea.jsx       # Message input component
│   │   └── InputArea.css
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Global styles and theme
│   ├── index.css               # Reset and base styles
│   └── main.jsx                # Application entry point
├── public/                     # Static assets
├── index.html                  # HTML template
├── package.json
├── vite.config.js             # Vite configuration
└── README.md
```

## Color Scheme

### Dark Theme (Black, Gray, White)
- **Primary Black**: `#0a0a0a` - Main background
- **Dark Background**: `#121212` - Secondary background
- **Light Gray**: `#e0e0e0` - Primary text
- **Medium Gray**: `#737373` - Secondary text
- **Border Gray**: `#3a3a3a` - Borders and dividers
- **White**: `#ffffff` - Accents and highlights
- **Accent Blue**: `#2563eb` - Interactive elements
- **Hover Gray**: `#2a2a2a` - Hover states

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## API Integration

The frontend connects to the backend API at `http://localhost:8000/api`. The following endpoints are used:

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{session_id}/messages` - Get session messages
- `POST /api/sessions/{session_id}/chat` - Send a message to the AI
- `DELETE /api/sessions/{session_id}` - Delete a session

### Environment Variables

Create a `.env.local` file if you need to customize the API endpoint:

```
VITE_API_URL=http://localhost:8000/api
```

## Component Documentation

### Header
- Displays application branding and logo
- "New Session" button for creating research sessions
- Responsive navigation

### Sidebar
- Lists all previous research sessions
- Shows session creation timestamps
- Quick delete functionality
- Empty state message when no sessions exist

### ChatArea
- Displays welcome screen for new sessions
- Shows message conversation history
- Implements auto-scroll to latest message
- Responsive grid layout for welcome features

### Message
- Renders individual chat messages
- User messages aligned right (blue background)
- AI messages aligned left (gray background)
- Support for basic markdown formatting
- Code block highlighting

### InputArea
- Textarea with auto-expand functionality
- Send button with loading state
- Keyboard shortcut hints
- Context-aware placeholder text

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Fast Load Time**: Optimized bundle size with tree-shaking
- **Smooth Scrolling**: Hardware-accelerated animations
- **Efficient Rendering**: React hooks and memoization
- **Responsive Design**: Mobile-first approach

## Accessibility

- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators on all interactive elements
- Color contrast compliance

## Future Enhancements

- Dark/Light theme toggle
- User authentication and profiles
- File upload for PDF research
- Advanced search filters
- Export conversation functionality
- Collaborative sessions
- Real-time collaboration features

## Troubleshooting

### API Connection Issues
If you see connection errors, ensure:
1. Backend server is running on `localhost:8000`
2. CORS is properly configured on the backend
3. Check browser console for detailed error messages

### Styling Issues
If styles appear broken:
1. Clear browser cache (Ctrl+Shift+Del)
2. Rebuild the project: `npm run build`
3. Check for CSS variable definitions in App.css

## Development Tools

### ESLint
Run linting checks:
```bash
npm run lint
```

### Vite Dev Server
Features include:
- Hot Module Replacement (HMR)
- Lightning-fast build times
- Optimized production bundles

## License

This project is part of the Broq AI Research Agent platform.

## Support

For issues, feature requests, or questions, please refer to the main project documentation.

---

**Built with ❤️ for Broq AI Research Platform**
