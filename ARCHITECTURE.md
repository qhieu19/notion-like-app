# Project Architecture

## Overview
A Notion-like app with task tracking and notes management, built with vanilla JavaScript and Supabase backend.

## Module Dependency Graph

```
┌─────────────────────────────────────────┐
│           index.html (Entry)            │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │   js/main.js  │
        │               │
        │ • initSupabase()
        │ • showToast()
        └───────┬───────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ js/notes.js  │ │ js/tasks.js  │
│              │ │              │
│ Notes CRUD   │ │ Tasks CRUD   │
│ • create     │ │ • create     │
│ • read       │ │ • read       │
│ • update     │ │ • update     │
│ • delete     │ │ • delete     │
│ • search     │ │ • search     │
└──────┬───────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   Supabase    │
        │   (PostgreSQL)│
        │               │
        │ • notes table │
        │ • tasks table │
        └───────────────┘
```

## Data Flow

### Notes Flow
```
User Action → notes.html → notes.js → Supabase → PostgreSQL
                              ↓
                        showToast() ← main.js
```

### Tasks Flow
```
User Action → tasks.html → tasks.js → Supabase → PostgreSQL
                              ↓
                        showToast() ← main.js
```

## File Structure

```
/
├── index.html          # Landing page with navigation
├── notes.html          # Notes management UI
├── tasks.html          # Kanban board UI
├── css/
│   └── style.css       # Unified styles + dark mode
├── js/
│   ├── main.js         # Core: Supabase init + toast system
│   ├── notes.js        # Notes CRUD operations
│   └── tasks.js        # Tasks CRUD + Kanban logic
├── tests/
│   ├── app.spec.js              # E2E tests (22 tests)
│   ├── visual-test.spec.js      # Visual testing
│   └── live-deployment.spec.js  # Production tests
└── SUPABASE_SETUP.md   # Database schema & setup

```

## Key Components

### 1. main.js (Shared Module)
- **Exports**: `initSupabase()`, `showToast()`
- **Responsibility**: Initialize Supabase client, toast notifications
- **Dependencies**: @supabase/supabase-js (CDN)

### 2. notes.js
- **Imports**: initSupabase, showToast from main.js
- **State**: notes[], currentNote, searchQuery
- **Operations**: fetchNotes(), renderNotes(), editNote(), deleteNote()
- **UI**: Modal form, search, detail view

### 3. tasks.js
- **Imports**: initSupabase, showToast from main.js
- **State**: tasks[], currentTask, searchQuery
- **Operations**: fetchTasks(), renderBoard(), editTask(), deleteTask()
- **UI**: Kanban board, column dropdowns, search

## Database Schema

### notes table
```sql
- id: uuid (PK)
- title: text
- content: text
- created_at: timestamp
- updated_at: timestamp
```

### tasks table
```sql
- id: uuid (PK)
- title: text
- description: text
- status: text
- priority: text (low/medium/high)
- task_column: text (backlog/todo/in-progress/done)
- created_at: timestamp
- updated_at: timestamp
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Backend**: Supabase (PostgreSQL + REST API)
- **Hosting**: Vercel (static site)
- **Testing**: Playwright (E2E)
- **Styling**: CSS custom properties (dark/light mode)

## Security

- Row Level Security (RLS) enabled on both tables
- Public access policies (for now)
- Environment variables for API keys
- XSS prevention via escapeHtml() utility

## Deployment

```
GitHub (main branch)
    ↓ (auto-deploy on push)
Vercel
    ↓
https://notion-like-app-seven.vercel.app/
```

**Environment Variables**:
- SUPABASE_URL
- SUPABASE_ANON_KEY
