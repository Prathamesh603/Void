# Broq AI Frontend - UI Layout Guide

## Desktop View (1024px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ Broq AI │ Research Agent    ┌──────────────────────────────────────┐ │
│             │ v1.0.0            │ [+] New Session                      │ │
└─────────────────────────────────────────────────────────────────────────┘
┌──────────────┬───────────────────────────────────────────────────────────┐
│              │                                                            │
│  Sessions:   │         ╔════════════════════════════════════════════╗    │
│              │         ║  Welcome to Broq AI                        ║    │
│  📄 Recent   │         ║  Your Research Intelligence Platform       ║    │
│     Session  │         ║                                            ║    │
│     1 day    │         ║  ┌──────────┐ ┌──────────┐ ┌────────────┐ ║    │
│              │         ║  │📚 Research│ │🔍Retrieval│ │📖 Knowledge│ ║    │
│  📄 Another  │         ║  │ Search   │ │ Find Info │ │Access Wiki  │ ║    │
│     Session  │         ║  └──────────┘ └──────────┘ └────────────┘ ║    │
│     2 days   │         ║                                            ║    │
│              │         ║  ┌──────────┐                              ║    │
│  ✎ New Chat  │         ║  │✨Intelligence│                          ║    │
│              │         ║  │AI-powered │                             ║    │
│              │         ║  └──────────┘                              ║    │
│              │         ║                                            ║    │
│              │         ║  Try asking:                               ║    │
│              │         ║  [Latest advances] [Attention mechanisms]  ║    │
│              │         ║  [Compare BERT and GPT] [Recent LLM]      ║    │
│              │         ╚════════════════════════════════════════════╝    │
│              │                                                            │
│              │                                                            │
│ Broq AI      │  ┌────────────────────────────────────────────────────────┐│
│ v1.0.0       │  │ How are transformers used in NLP?                      ││
│              │  │                                        [User message]   ││
│              │  ├────────────────────────────────────────────────────────┤│
│              │  │ 🤖 Transformers are fundamental architectures in NLP   ││
│              │  │    that use attention mechanisms...                   ││
│              │  │    [AI response message]                              ││
│              │  ├────────────────────────────────────────────────────────┤│
│              │  │ Tell me more about attention                           ││
│              │  │                                        [User message]   ││
│              │  └────────────────────────────────────────────────────────┘│
│              │  ┌────────────────────────────────────────────────────────┐│
│              │  │ Ask me anything about papers, code, or research...    ││
│              │  │ [Send]                                            ▲▲▲ ││
│              │  │ 💡 Tip: Use Ctrl+Enter to send quickly             ││
│              │  └────────────────────────────────────────────────────────┘│
└──────────────┴───────────────────────────────────────────────────────────┘
```

## Tablet View (768px - 1023px)

```
┌──────────────────────────────────────────────────────┐
│  ⚡ Broq AI │ Research Agent    [+] New Session      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ╔════════════════════════════════════════════╗     │
│  ║  Welcome to Broq AI                        ║     │
│  ║  Your Research Intelligence Platform       ║     │
│  ║                                            ║     │
│  ║  ┌─────────┐  ┌─────────┐                 ║     │
│  ║  │📚Research│ │🔍Retrieval                ║     │
│  ║  └─────────┘  └─────────┘                 ║     │
│  ║                                            ║     │
│  ║  ┌─────────┐  ┌─────────┐                 ║     │
│  ║  │📖 Knowledge│ │✨Intelligence│            ║     │
│  ║  └─────────┘  └─────────┘                 ║     │
│  ║                                            ║     │
│  ║  Try asking:                               ║     │
│  ║  [Latest advances] [Attention mechanisms]  ║     │
│  ║  [Compare BERT] [Recent LLM]               ║     │
│  ╚════════════════════════════════════════════╝     │
│                                                      │
│  [Message Input - Full Width]                       │
│  [Send] 💡 Ctrl+Enter shortcut                      │
└──────────────────────────────────────────────────────┘
```

## Mobile View (<768px)

```
┌───────────────────────────────┐
│ ⚡ Broq AI │ [+]              │
└───────────────────────────────┘
┌───────────────────────────────┐
│                               │
│  Welcome to Broq AI           │
│  Research Intelligence        │
│                               │
│  ┌────────────┐               │
│  │📚 Research │               │
│  └────────────┘               │
│                               │
│  ┌────────────┐               │
│  │🔍 Retrieval│               │
│  └────────────┘               │
│                               │
│  ┌────────────┐               │
│  │📖 Knowledge│               │
│  └────────────┘               │
│                               │
│  [Try asking:]                │
│  [Advances]                   │
│  [Mechanisms]                 │
│                               │
│  ┌──────────────────────────┐ │
│  │ Ask me anything...        │ │
│  │                           │ │
│  │ [Send]                    │ │
│  └──────────────────────────┘ │
│                               │
└───────────────────────────────┘
```

---

## Color Usage

### Header Section
- Background: `--primary-black` (#0a0a0a)
- Border: `--border-gray` (#3a3a3a)
- Logo Text: `--white` (#ffffff)
- Button: `--accent-blue` (#2563eb)

### Sidebar Section
- Background: `--dark-bg` (#121212)
- Session Item: `--hover-gray` (#2a2a2a) on hover
- Active Session: Border with `--border-gray`
- Text: `--light-gray` (#e0e0e0)
- Delete Button: Red on hover

### Main Chat Area
- Background: `--primary-black` (#0a0a0a)
- User Message: `--accent-blue` (#2563eb)
- AI Message: `--hover-gray` (#2a2a2a) with `--border-gray` border
- Input: `--hover-gray` background

---

## Component Dimensions

### Header
- Height: 72px (fixed)
- Padding: 0 24px
- Border-bottom: 1px solid

### Sidebar
- Width: 280px (desktop)
- Hidden: Mobile (<768px)
- Border-right: 1px solid

### ChatArea
- Flex: 1 (takes remaining space)
- Messages padding: 24px
- Input padding: 16px 20px

### Textarea Input
- Min height: 44px
- Max height: 200px (auto-expands)
- Padding: 12px 16px

### Send Button
- Size: 44px minimum
- Padding: 12px 16px
- Border-radius: 6px

---

## Typography

### Font Stack
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
'Helvetica Neue', sans-serif
```

### Sizes
- Logo: 20px (28px icon)
- Tagline: 12px
- Section Title: 24px-32px
- Body Text: 14px
- Small Text: 12px-11px

### Font Weights
- Logo: 700
- Headers: 600
- Tagline: 500
- Body: 400

---

## Spacing Standards

### Padding
- Large: 24px
- Medium: 16px
- Small: 12px
- Tiny: 8px

### Gaps
- Component gaps: 12px
- List items: 4px
- Feature grid: 16px

### Margins
- None (use padding and gaps instead)

---

## Interactive Elements

### Buttons
```
Default:     background: --accent-blue
Hover:       darker blue, slight lift, shadow
Active:      pressed state, no lift
Disabled:    opacity: 0.5, no hover effects
Loading:     spinner animation
```

### Text Input
```
Default:     border: --border-gray
Hover:       border: --medium-gray
Focus:       border: --accent-blue, shadow glow
Disabled:    opacity: 0.6, cursor: not-allowed
```

### Messages
```
User:        right-aligned, --accent-blue background
AI:          left-aligned, --hover-gray background
Loading:     pulsing dots animation
```

---

## Animations

### Fade In
- Duration: 0.3s
- Easing: ease-in-out
- Used: Welcome screen, initial load

### Slide Up
- Duration: 0.3s
- Easing: ease-in-out
- Used: Messages as they appear

### Pulse
- Duration: 1.4s
- Used: Loading indicator dots
- Staggered animation

### Hover Lift
- Transform: translateY(-1px)
- Duration: 0.2s
- Used: Buttons on hover

---

## Focus States

All interactive elements have:
- Outline: 2px solid `--accent-blue`
- Outline-offset: 2px

---

## Accessibility Features

✅ Semantic HTML
✅ ARIA labels on buttons
✅ Focus indicators visible
✅ Color contrast meets WCAG AA
✅ Keyboard navigation support
✅ Touch-friendly button sizes (44px minimum)

---

## Scroll Behavior

### Messages Container
- Overflow-y: auto
- Smooth auto-scroll to bottom on new messages
- Custom scrollbar styling

### Textarea Input
- Max height: 200px
- Overflow-y: auto
- Auto-expands up to max

---

## Responsiveness Strategy

1. **Mobile First**: Design starts at mobile (320px)
2. **Progressive Enhancement**: Enhance for larger screens
3. **Breakpoints**:
   - Mobile: <768px (single column)
   - Tablet: 768px-1023px (sidebar hidden)
   - Desktop: 1024px+ (full layout)

4. **Layout Changes**:
   - Sidebar: Display none on mobile
   - Messages: Max-width adjusts (70% → 85%)
   - Input: Full width on mobile
   - Padding: Reduced on mobile

---

## Performance Optimizations

- Hardware-accelerated transforms
- CSS variables for efficient theming
- Minimal repaints/reflows
- Smooth 60fps animations
- Optimized font loading

---

**Broq AI Research Agent - UI Design System**
