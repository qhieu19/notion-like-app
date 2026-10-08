# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: notion-like-app (or your preferred name)
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for this app
5. Click "Create new project" (takes ~2 minutes)

## 2. Create Database Tables

Once your project is created:

### Open SQL Editor
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the SQL below:

```sql
-- Create notes table
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  column text DEFAULT 'todo',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - refine later with auth)
CREATE POLICY "Enable all operations for notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX notes_created_at_idx ON notes(created_at DESC);
CREATE INDEX tasks_created_at_idx ON tasks(created_at DESC);
CREATE INDEX tasks_column_idx ON tasks(column);
```

4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned"

## 3. Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** (gear icon in sidebar)
2. Click **API**
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)
4. Copy both values - you'll need them for Vercel

## 4. Test Your Database

1. Go to "Table Editor" in Supabase
2. You should see `notes` and `tasks` tables
3. Click on `notes` and try adding a test row:
   - title: "Test Note"
   - content: "This is a test"
   - Leave other fields as default
4. Click "Save"
5. If successful, your database is ready!

## Next Steps

Once you have your Supabase credentials:
- Continue to GitHub setup
- Then deploy to Vercel with these credentials

---

**Security Note**: The current policies allow public access. For production with user authentication, you'll want to:
1. Enable Supabase Auth
2. Update policies to check `auth.uid()`
3. Add user_id columns to tables
