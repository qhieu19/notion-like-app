# Git Context (Ponytail Optimized)

## Current State (2026-10-08)
```
Branch: main
Latest: f1532cc - docs: add comprehensive documentation
Status: Clean (all changes committed)
Remote: origin/main (synced)
```

## Commit History (Optimized Summary)
Instead of reading `git log`, use this:

```
f1532cc (HEAD) docs: add comprehensive git history and architecture documentation
13c263f        feat: remove demo mode, always use Supabase database ⭐
7183315        fix: update remaining column filter reference
6f3fb70        fix: rename column to task_column for PostgreSQL compatibility ⚠️
f56220d        docs: add deployment checklist
55baa3f        chore: remove workflow file for initial push
8b96ecb        feat: add full CRUD, search, toast notifications, and comprehensive tests
9e326f6        chore: add .gitignore and remove node_modules
d406627        feat: initial Notion-like app with task tracking and notes
```

⭐ = Breaking change / Major feature
⚠️ = Critical fix to know about

## Key Decisions Locked In

### ✅ Decided (Don't Question These)
1. **No Demo Mode** (removed 13c263f) - Always use Supabase
2. **field: task_column** (not `column`) - PostgreSQL reserved keyword
3. **Toast notifications** (not alerts) - Better UX
4. **Vanilla JS** (no framework) - Keep it simple
5. **Playwright for tests** - E2E testing
6. **Vercel hosting** - Auto-deploy from main
7. **ES6 modules** - Use import/export

### 🔄 Open to Change
- UI/UX improvements
- Additional features
- Performance optimizations
- Test coverage expansion

## Breaking Changes Timeline
```
2026-10-08 13c263f: Removed demo mode
                    - Deleted: window.isDemo()
                    - Deleted: All localStorage code
                    - Impact: All operations now require Supabase

2026-10-08 6f3fb70: Renamed column → task_column
                    - Changed: Database schema
                    - Changed: All js/tasks.js references
                    - Impact: Old queries will fail
```

## Conventional Commit Pattern (Use This)
```
feat:     New feature (e.g., feat: add user authentication)
fix:      Bug fix (e.g., fix: resolve task deletion error)
docs:     Documentation only
chore:    Maintenance, deps, config
refactor: Code restructure, no behavior change
test:     Test additions/changes
style:    Formatting, no logic change
```

## Git Workflow (For Claude)
```bash
# Standard flow (don't ask, just do this):
git add <files>
git commit -m "type: description\n\nCo-Authored-By: Claude Code <noreply@anthropic.com>"
git push origin main

# Check status without reading full log:
git status --short
git log --oneline -5  # Last 5 commits only
```

## Branch Policy
- **main**: Production (always deployable)
- **No feature branches**: Direct to main (small project)
- **Always deployable**: Every commit triggers Vercel deploy

## Common Git Queries (Token Efficient)

### Q: What changed recently?
A: Read this file's "Commit History" section above

### Q: When was X feature added?
A: 
- Demo mode removed: 13c263f (2026-10-08)
- PostgreSQL fix: 6f3fb70 (recent)
- Full CRUD: 8b96ecb (initial version)

### Q: Why is field named task_column?
A: 6f3fb70 - `column` is PostgreSQL reserved keyword

### Q: Can I add localStorage?
A: No - removed in 13c263f (demo mode removal)

### Q: Who's working on this?
A: qhieu19 (owner) + Claude Code (AI assistant)

## File Change Frequency (Last 10 Commits)
```
js/notes.js       ████████░░ High - Core feature file
js/tasks.js       ████████░░ High - Core feature file
js/main.js        ████░░░░░░ Medium - Stable utilities
index.html        ███░░░░░░░ Low - Stable landing
css/style.css     ██░░░░░░░░ Low - Styling tweaks
tests/*.spec.js   ███░░░░░░░ Low - Test maintenance
```

**Optimization**: Read high-frequency files first for context

## Deployment History
Every commit to main → Vercel deploy:
```
f1532cc → ✅ Deployed (docs only)
13c263f → ✅ Deployed (demo mode removal)
7183315 → ✅ Deployed (filter fix)
6f3fb70 → ✅ Deployed (task_column fix)
```

## Quick Answers (Don't Run Git Commands)

**Last deploy**: f1532cc (2026-10-08)
**Last breaking change**: 13c263f (demo mode removal)
**Last critical fix**: 6f3fb70 (PostgreSQL keyword)
**Total commits**: 9
**Project age**: Recent (< 1 week based on commit density)
**Active development**: Yes (multiple commits today)

## Git Attribution
All commits co-authored with:
```
Co-Authored-By: Claude Code <noreply@anthropic.com>
```
