# Project Graph (Graphify Optimized)

## Dependency Tree (Read in This Order)
```
1. js/main.js          [ALWAYS READ FIRST - 40 lines, core utilities]
   ├─ Exports: initSupabase(), showToast()
   └─ No dependencies
   
2. js/notes.js OR js/tasks.js OR js/tracker.js  [READ ONLY ONE unless both affected]
   ├─ Import from: js/main.js
   └─ Call: supabase.from('notes') or supabase.from('tasks') or localStorage
   
3. notes.html OR tasks.html OR tracker.html    [READ ONLY if UI changes needed]
   └─ Load: corresponding .js file as module
```

## File Size & Complexity
| File | Lines | Complexity | Read When |
|------|-------|------------|-----------|
| js/main.js | 40 | Low | Always for shared utils |
| js/notes.js | 180 | Medium | Note features only |
| js/tasks.js | 250 | Medium | Task features only |
| css/style.css | 600 | Low | Styling issues only |
| tests/app.spec.js | 400 | High | Test failures only |
| SUPABASE_SETUP.md | 150 | Low | Schema changes only |

## Critical Paths (Token-Efficient Reading)

### User Creates Note
```
User clicks → notes.html (modal) → notes.js:setupForm() → 
supabase.insert() → showToast() ← main.js
```
**Files to read**: js/main.js (30 lines), js/notes.js (lines 107-135)

### User Moves Task
```
User selects dropdown → tasks.js:addEventListener('change') → 
supabase.update() → fetchTasks() → renderBoard()
```
**Files to read**: js/tasks.js (lines 203-231 + 27-45)

### Search Functionality
```
User types → setupSearch() listener → filter by searchQuery → 
renderNotes() or renderBoard()
```
**Files to read**: js/notes.js (lines 165-173) OR js/tasks.js (lines 274-283)

## Data Flow (Optimized for Reading)

### Notes Module
```
notes.js State:
  - notes[]      → Cached from Supabase
  - currentNote  → Edit mode tracking
  - searchQuery  → Filter string

Key Functions:
  - fetchNotes()    → Read from DB [lines 26-40]
  - renderNotes()   → Display logic [lines 42-86]
  - editNote(id)    → Pre-fill form [lines 138-148]
  - deleteNote(id)  → Remove from DB [lines 151-164]
```

### Tasks Module
```
tasks.js State:
  - tasks[]      → Cached from Supabase
  - currentTask  → Edit mode tracking
  - searchQuery  → Filter string

Key Functions:
  - fetchTasks()    → Read from DB [lines 26-45]
  - renderBoard()   → Kanban display [lines 48-105]
  - editTask(id)    → Pre-fill form [lines 234-247]
  - deleteTask(id)  → Remove from DB [lines 250-263]
```

## Token Budget Guidelines

### Minimal Context (100-200 tokens)
- Read: js/main.js only
- For: Toast changes, Supabase init issues

### Small Feature (500-1000 tokens)
- Read: js/main.js + ONE of (notes.js OR tasks.js)
- For: CRUD operations, search tweaks

### UI Changes (1000-1500 tokens)
- Read: js/main.js + ONE controller + ONE html file
- For: Modal changes, form additions

### Full Context (2000+ tokens)
- Read: All js/ files + relevant html
- For: Architecture changes, cross-module features

## Quick Grep Patterns (Don't Read Files)
```bash
# Find where a function is called
grep -rn "functionName" js/

# Find all Supabase operations
grep -rn "supabase\\.from" js/

# Find all toast calls
grep -rn "showToast" js/

# Check for demo mode (should be empty)
grep -rn "isDemo\|localStorage\\.getItem" js/
```

## Import/Export Map
```
js/main.js:
  exports → initSupabase, showToast
  
js/notes.js:
  imports → initSupabase, showToast from './main.js'
  no exports (IIFE pattern)
  
js/tasks.js:
  imports → initSupabase, showToast from './main.js'
  no exports (IIFE pattern)
```

## Modification Impact Matrix
| Change Location | Affects Files | Must Read | Must Test |
|-----------------|---------------|-----------|-----------|
| js/main.js exports | notes.js, tasks.js | All 3 files | Both pages |
| js/notes.js only | notes.html | main.js, notes.js | Notes page |
| js/tasks.js only | tasks.html | main.js, tasks.js | Tasks page |
| css/style.css | All HTML | None (CSS only) | Visual check |
| SUPABASE_SETUP.md | Relevant .js | Schema + 1 controller | CRUD ops |

## Read Strategy by Task Type

**Bug Fix**: Read main.js + affected controller (notes.js OR tasks.js)
**New Feature**: Read main.js + affected controller + html
**Refactor**: Read all 3 js files
**Style Fix**: Read css/style.css only
**Test Fix**: Read tests/ + relevant controller
**Database**: Read SUPABASE_SETUP.md + affected controller
