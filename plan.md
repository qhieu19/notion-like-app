# Notion-like App: Task Tracking + Notes System

## Overview
A personal, serverless Notion-like app running on Vercel, connected to Supabase. Focuses on **task tracking** and **notes organization** using core HTML/CSS/JS with Supabase APIs.

## Architecture

### Frontend
- **HTML/CSS/JS** (no framework) — per user preference
- Static site deployed to Vercel
- UI for creating/reading/updating notes and tasks

### Backend (Supabase)
- **Supabase Project** — needs to be created
- **Tables**: `notes`, `tasks`
- **Authentication** — optional, per user preference
- **Storage** — for any attachments/medias

### Data Model

#### `notes` table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (primary key) | Unique identifier |
| title | text | Note title |
| content | text | Rich text content |
| created_at | timestamp | Auto-created |
| updated_at | timestamp | Auto-updated |

#### `tasks` table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (primary key) | Unique identifier |
| title | text | Task title |
| description | text | Task description |
| status | text | e.g., "todo", "in-progress", "done" |
| priority | text | e.g., "low", "medium", "high" |
| column | text | Kanban column (backlog, todo, in-progress, done) |
| created_at | timestamp | Auto-created |
| updated_at | timestamp | Auto-updated |

### Features
- [ ] Note creation with title + content
- [ ] Note listing/reading
- [ ] Task creation with title, description, status, priority
- [ ] Kanban-style task board (columns: backlog, todo, in-progress, done)
- [ ] Task filtering/searching
- [ ] Supabase authentication (optional)
- [ ] Responsive design (mobile + desktop)

### Vercel Deployment
- `vercel.json` for edge functions if needed
- Environment variables for Supabase URL + anon key
- GitHub integration for auto-deploys

### Supabase Setup Required
1. Create Supabase project
2. Run migrations to create `notes` and `tasks` tables
3. Get `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Configure CORS if needed

### Development Flow
1. HTML structure for note and task UIs
2. Supabase client initialization
3. CRUD operations for notes
4. CRUD operations for tasks + kanban board
5. Styling + responsiveness
6. Vercel deployment

### File Structure (planned)
```
/
  index.html          # Home page
  notes.html        # Notes management
  tasks.html        # Task kanban board
  css/
    style.css       # All styling
  js/
    main.js         # Supabase initialization
    notes.js        # Notes CRUD
    tasks.js        # Tasks CRUD + kanban
  vercel.json       # Deployment config
  supabase/
    schema.sql      # Database schema
```

## UI Review
The user requested a UI to review. I'll create a basic HTML prototype showing the layout for:
- Notes list/create form
- Tasks kanban board
- Mobile/responsive considerations

Let me know if this architecture aligns with your vision, or if you'd like me to adjust anything before building the UI prototype.