# Project Context for Claude Code

## Quick Summary
Notion-like app: vanilla JS + Supabase backend. Notes & tasks CRUD. Deployed on Vercel.

## Critical Context
- **NO DEMO MODE**: All operations use Supabase (removed 2026-10-08)
- **PostgreSQL Keyword**: Use `task_column` NOT `column` (reserved keyword)
- **Auto-deploy**: Push to main → Vercel deploys automatically
- **Tests**: Playwright in `tests/` directory (run `npx playwright test`)

## File Roles (Read These First)
```
js/main.js       → Core: initSupabase() + showToast() [40 lines]
js/notes.js      → Notes CRUD [180 lines]
js/tasks.js      → Tasks CRUD + Kanban [250 lines]
css/style.css    → All styles + dark mode [600 lines]
```

## Module Dependencies
```
main.js (exports initSupabase, showToast)
  ├─→ notes.js (imports both)
  └─→ tasks.js (imports both)
```

## Database Schema Quick Reference
```sql
-- notes: id, title, content, created_at, updated_at
-- tasks: id, title, description, status, priority, task_column, created_at, updated_at
```

## Common Operations

### Adding a Feature
1. Read relevant file first (notes.js OR tasks.js, not both unless needed)
2. Update UI if needed (notes.html OR tasks.html)
3. Test locally: `python3 -m http.server 8888`
4. Run tests: `npx playwright test`
5. Commit with conventional commits: `feat:` / `fix:` / `docs:` / `chore:`

### Database Changes
1. Update SUPABASE_SETUP.md
2. Apply SQL in Supabase dashboard
3. Update corresponding js file (notes.js or tasks.js)
4. Test CRUD operations

### Deployment
- Just push to main - Vercel handles the rest
- No manual build needed
- Check: https://notion-like-app-seven.vercel.app/

## Token Optimization Tips

### DON'T Read These Unless Explicitly Needed
- `tests/*.spec.js` - Only for test debugging
- `css/style.css` - Only for styling issues
- `SUPABASE_SETUP.md` - Only for schema changes
- Git history - Check GIT_HISTORY.md instead

### DO Read These First
- Relevant controller: `js/notes.js` XOR `js/tasks.js`
- Only if UI needed: `notes.html` XOR `tasks.html`
- `js/main.js` - Only if changing shared functions

### Quick Checks Without Reading Files
```bash
# Find all references to a function
grep -r "functionName" js/

# Check if demo mode exists (should be 0 results)
grep -r "isDemo" js/

# Find database operations
grep -r "supabase.from" js/
```

## Recent Breaking Changes (Last 7 Days)
- **2026-10-08**: Removed demo mode - no localStorage anymore
- **Before**: Fixed `column` → `task_column` for PostgreSQL compatibility

## Environment Variables (Vercel)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key

## Anti-Patterns to Avoid
- ❌ Don't use `column` as field name (PostgreSQL reserved)
- ❌ Don't add localStorage (demo mode removed)
- ❌ Don't use alert() (use showToast() instead)
- ❌ Don't hardcode Supabase credentials (use env vars)
- ❌ Don't push directly to main without testing

## Quick Reference: Where to Find Things
| Need | File | Lines |
|------|------|-------|
| Toast notifications | js/main.js | 15-30 |
| Supabase init | js/main.js | 5-10 |
| Note CRUD | js/notes.js | Entire file |
| Task CRUD | js/tasks.js | Entire file |
| Kanban rendering | js/tasks.js | 48-105 |
| Search logic | js/notes.js & tasks.js | Look for `searchQuery` |
| Modal forms | notes.html & tasks.html | Modal divs |

## Performance Notes
- ES6 modules load from CDN (Supabase client)
- No build step - pure static site
- HTTP server needed locally for ES6 modules (port 8888)
- Tests use localhost:8888 NOT file:// protocol
