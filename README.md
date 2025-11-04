# Personal Finance Assistant — One-Page Prototype (Midterm)

This is a one-page *proof-of-concept* prototype for a Personal Finance Assistant (PFA).  
The primary goal of the midterm stage is to demonstrate UX, core mechanics, and feasibility — **without backend**.

### Tech Stack
- HTML + CSS (SASS compiled to inline CSS)
- Vanilla JavaScript
- Chart.js for visualisation
- LocalStorage for persistence
- Currency: **UZS** (all numbers in this prototype are represented in **thousands UZS** for readability)

### Features Implemented
| Scope | Status |
|--------|--------|
| Monthly KPI summary (Income / Expense / Net) | ✅ |
| Add transactions manually | ✅ |
| Category auto-detection | ✅ |
| Dynamic budgets per category | ✅ |
| Ability to add / edit / delete category limits | ✅ |
| Categories without limit are supported and visually indicated (`No limit`) | ✅ |
| Sorting budgets (Name / Spent desc / Over-first) | ✅ |
| Pie chart view by categories | ✅ |
| Data persistence via localStorage | ✅ |

### Data Model
- Transactions stored locally as `[{ date, type, amount(kUZS), category, merchant }]`
- Positive amount → income
- Negative amount → expense
- No network / no backend used in midterm stage.

### Known Limitations
- No CSV import yet
- No authentication
- No multi-user support
- No recommendations engine yet

These parts are intentionally postponed to **final stage**.

### Goal by Final
- backend API (NestJS / Laravel — TBD)
- cloud persistence
- import/export
- recommendation patterns (overspending detection, monthly alerts, category suggestions)
- simple reporting

---
