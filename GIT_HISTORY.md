# Git History Visualization

## Recent Development Timeline

```
main branch
│
├─ 13c263f  feat: remove demo mode, always use Supabase database
│           • Removed demo mode toggle from UI
│           • Removed localStorage operations
│           • App now always uses Supabase
│           [2026-10-08]
│
├─ 7183315  fix: update remaining column filter reference
│           • Fixed PostgreSQL reserved keyword issue
│           [Recent]
│
├─ 6f3fb70  fix: rename column to task_column for PostgreSQL compatibility
│           • Changed 'column' to 'task_column' everywhere
│           • Updated SQL schema
│           [Recent]
│
├─ f56220d  docs: add deployment checklist
│           • Documentation improvements
│           [Recent]
│
├─ 55baa3f  chore: remove workflow file for initial push
│           • GitHub workflow cleanup
│           [Recent]
│
└─ 8b96ecb  feat: add full CRUD, search, toast notifications, and comprehensive tests
            • Initial full-featured implementation
            • Playwright test suite
            • Search functionality
            [Recent]
```

## Development Phases

### Phase 1: Initial Setup (8b96ecb)
- Basic CRUD operations
- Supabase integration
- Toast notification system
- Comprehensive test suite (22 tests)
- Search functionality

### Phase 2: Bug Fixes (6f3fb70, 7183315)
- **Critical**: PostgreSQL reserved keyword conflict
  - Problem: `column` is reserved in PostgreSQL
  - Solution: Renamed to `task_column`
  - Impact: Fixed all database operations

### Phase 3: Cleanup & Deploy (55baa3f, f56220d)
- Removed GitHub Actions workflow
- Added deployment documentation
- Successful Vercel deployment

### Phase 4: Production Ready (13c263f - LATEST)
- **Major**: Removed demo mode completely
  - All operations now use real database
  - Simplified codebase
  - Better user experience

## Commit Patterns

### Feature Commits
- `feat:` - New features or major enhancements
- Example: Full CRUD, demo mode removal

### Fix Commits
- `fix:` - Bug fixes and corrections
- Example: PostgreSQL keyword issue

### Chore Commits
- `chore:` - Maintenance and cleanup
- Example: Workflow file removal

### Documentation Commits
- `docs:` - Documentation updates
- Example: Deployment checklist

## Key Contributors
- qhieu19 (Primary developer)
- Claude Code (AI pair programmer)

## Branch Strategy
- **main**: Production branch (auto-deploys to Vercel)
- Linear history with no feature branches
- Direct commits to main with immediate deployment

## Deployment Triggers
Every push to `main` triggers:
1. GitHub webhook
2. Vercel build process
3. Automatic deployment
4. Live at: https://notion-like-app-seven.vercel.app/
