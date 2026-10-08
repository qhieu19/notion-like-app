# Personal Notion-like App

A simple task tracking and notes system built with HTML/CSS/JS and Supabase, designed to run on Vercel.

## Features
- **Notes**: Create and organize rich text notes
- **Tasks**: Kanban board with columns (Backlog, To Do, In Progress, Done)
- **Demo Mode**: Works without Supabase using localStorage
- **Responsive**: Mobile-friendly design
- **Dark/Light**: Adapts to system preference

## File Structure
```
/
  index.html          # Home page with navigation
  notes.html          # Notes management interface
  tasks.html          # Task Kanban board
  css/
    style.css         # All styling
  js/
    main.js           # Supabase initialization + demo mode toggle
    notes.js          # Notes CRUD operations
    tasks.js          # Tasks CRUD + Kanban board
```

## Setup Instructions

### 1. Supabase Setup (Optional for demo)
1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create the following tables:

#### Notes table
```sql
create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Tasks table
```sql
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  column text default 'todo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 2. Environment Variables
For Vercel deployment, set these in your project settings:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

### 3. Running Locally
Simply open `index.html` in a browser. The app will run in demo mode (using localStorage) until you configure Supabase.

### 4. Vercel Deployment
1. Push this repository to GitHub
2. Import the project in Vercel
3. Add the environment variables above
4. Vercel will automatically detect it's a static site and deploy

## Demo Mode
Toggle demo mode on/off from the home page. In demo mode:
- Data persists in localStorage
- No Supabase connection needed
- Great for testing or offline use

## Customization
- Modify `css/style.css` to change colors/theme
- Add more fields to notes/tasks by updating the HTML forms and JS logic
- Extend the Kanban board with more columns or swimlanes

## Notes
- This is a basic implementation meant for personal use
- For production, consider adding:
  - User authentication (Supabase Auth)
  - Rich text editor (like Quill or TipTap)
  - File uploads (Supabase Storage)
  - Real-time updates (Supabase Realtime)
  - Better error handling and loading states