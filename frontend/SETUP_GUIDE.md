# Frontend Setup & Deployment Guide

## Quick Start

### Prerequisites
Ensure you have:
- Node.js 16+ installed
- Backend API running on `http://localhost:8000`

### Installation & Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (hot reload enabled)
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Environment Configuration

### Development Mode
The frontend automatically connects to the backend at `http://localhost:8000/api` through Vite's proxy configuration.

### Production Mode
Update the API endpoint in `App.jsx` line 15:
```javascript
const API_BASE_URL = 'http://your-backend-url/api';
```

## Frontend Architecture

### Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Modern CSS with CSS Variables
- **State Management**: React Hooks (useState, useEffect, useRef)

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation and branding (72px fixed height)
│   │   ├── Sidebar.jsx         # Session list (280px width, collapsible on mobile)
│   │   ├── ChatArea.jsx        # Main chat interface with welcome screen
│   │   ├── Message.jsx         # Individual message rendering
│   │   └── InputArea.jsx       # Message input with auto-expand
│   ├── App.jsx                 # Main application logic and state
│   ├── App.css                 # Global styles and color scheme
│   ├── index.css               # Reset and base styles
│   └── main.jsx                # React entry point
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.js             # Build configuration with proxy
└── package.json
```

## Color Scheme

All colors are defined as CSS variables in `App.css`:

```css
--primary-black: #0a0a0a        /* Main background */
--dark-bg: #121212              /* Secondary background */
--light-gray: #e0e0e0           /* Primary text */
--medium-gray: #737373          /* Secondary text */
--border-gray: #3a3a3a          /* Borders */
--white: #ffffff                /* Highlights */
--accent-blue: #2563eb          /* Buttons, links */
--hover-gray: #2a2a2a           /* Hover states */
```

## Component Details

### Header Component
- Fixed height: 72px
- Contains logo and branding
- "New Session" button for creating research sessions
- Props: `onNewSession`

### Sidebar Component
- Fixed width: 280px on desktop, hidden on mobile (<768px)
- Displays list of sessions with timestamps
- Hover effects for quick delete
- Empty state message
- Props: `sessions`, `currentSessionId`, `onSelectSession`, `onNewSession`, `onDeleteSession`

### ChatArea Component
- Main content area with flex-1 growth
- Welcome screen for new sessions with:
  - Feature grid (4 feature cards)
  - Suggestion pills for quick start
- Message list with auto-scroll
- Props: `messages`, `loading`, `onSendMessage`, `isNewSession`

### Message Component
- User messages: Right-aligned, blue background (#2563eb)
- AI messages: Left-aligned, gray background with border
- Supports basic markdown formatting
- Props: `message`, `isUser`

### InputArea Component
- Auto-expanding textarea (min 44px, max 200px)
- Send button with loading state
- Keyboard shortcut: Ctrl+Enter to send
- Props: `onSendMessage`, `loading`, `isNewSession`

## API Integration

### Session Endpoints Used

```
GET     /api/sessions                              - List all sessions
POST    /api/sessions                              - Create new session
GET     /api/sessions/{session_id}/messages        - Get session messages
POST    /api/sessions/{session_id}/chat            - Send message
DELETE  /api/sessions/{session_id}                 - Delete session
```

### Request/Response Format

**Create Session:**
```json
POST /api/sessions
{
  "title": "Research Topic..."
}
```

**Send Message:**
```json
POST /api/sessions/{session_id}/chat
{
  "message": "What are transformers?"
}

Response:
{
  "response": "AI response here..."
}
```

## Responsive Design Breakpoints

- **Desktop**: 1024px+ (both sidebar and chat visible)
- **Tablet**: 768px - 1023px (full-width layout)
- **Mobile**: <768px (sidebar hidden, full-screen chat)

## Performance Optimizations

1. **Code Splitting**: Vite automatically splits components
2. **Lazy Scrolling**: Messages container uses overflow-y: auto
3. **CSS Variables**: Efficient theme management
4. **Smooth Animations**: Hardware-accelerated transforms
5. **Debounced Textarea**: Auto-height calculation optimized

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Troubleshooting

### Issue: API Connection Errors
**Solution:**
1. Verify backend is running: `http://localhost:8000`
2. Check CORS settings in backend
3. Open browser DevTools (F12) → Network tab for error details

### Issue: Styles Not Loading
**Solution:**
1. Clear cache: Ctrl+Shift+Del in browser
2. Force refresh: Ctrl+F5
3. Check CSS variables in `App.css`

### Issue: Messages Not Sending
**Solution:**
1. Check browser console for errors
2. Verify backend API is responding
3. Check network requests in DevTools

## Development Workflow

### Adding New Features

1. **Create Component**: Add `.jsx` and `.css` files in `src/components/`
2. **Import in App.jsx**: Add component import and usage
3. **Test**: Use `npm run dev` for hot reload testing
4. **Build**: Run `npm run build` for production

### CSS Guidelines

- Use CSS variables for colors (defined in `App.css`)
- Follow BEM-like naming: `.component-name`, `.component-name__child`
- Mobile-first approach with `@media` queries
- Use `transition: all 0.2s ease` for smooth interactions

## Deployment

### Static Hosting (Vercel, Netlify, etc.)

1. Build the project:
```bash
npm run build
```

2. Deploy `dist/` directory

3. Update API endpoint in environment variables:
```
VITE_API_URL=https://your-api.com/api
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Performance Tips

- **Minimize Bundles**: Current build is ~150KB (gzipped)
- **Lazy Load**: Components load on demand
- **Optimize Images**: No images in base design
- **Monitor**: Use DevTools Performance tab

## Security Considerations

- ✅ No sensitive data in localStorage
- ✅ API calls use fetch (no exposed credentials)
- ✅ XSS prevention: React auto-escapes by default
- ✅ CSRF: Backend should handle CSRF tokens if needed

## Support & Documentation

For more information, see:
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Frontend README](./README.md)
- Backend API documentation in backend folder

---

**Broq AI Research Agent - Frontend v1.0.0**
