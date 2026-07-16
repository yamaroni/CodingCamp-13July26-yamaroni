# Implementation Plan: Todo List Life Dashboard

## Overview

Build a zero-dependency, single-page productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. All logic lives in one IIFE inside `js/app.js`; all state is persisted to `localStorage` under two fixed keys. Implementation proceeds widget-by-widget, wiring everything together in the final phase.

## Tasks

- [x] 1. Set up project structure and shared utilities
  - Create `index.html` with semantic widget markup: `<section id="greeting-widget">`, `<section id="focus-timer">`, `<section id="todo-list">`, `<section id="quick-links">`
  - Create `css/style.css` with CSS custom properties (theme tokens), base reset, card layout styles, responsive single-column breakpoint (max-width: 768px), minimum 14px font size, WCAG 2.1 AA contrast tokens
  - Create `js/app.js` with top-level IIFE skeleton and module-scope variable declarations (`clockInterval`, `timerInterval`, `timerState`, `todos`, `links`)
  - Implement `generateId()` — `crypto.randomUUID()` with `Date.now()+Math.random()` fallback
  - Implement `loadFromStorage(key)` — try/catch JSON.parse, array-check, `showStorageError(key)` on failure, return `[]`
  - Implement `persistTodos()` and `persistLinks()` — synchronous `localStorage.setItem` calls
  - _Requirements: 10.1, 10.3, 10.4, 10.5, 6.4, 9.4_

- [ ] 2. Implement Greeting_Widget
  - [~] 2.1 Implement pure helper functions: `formatTime(date)`, `formatDate(date)`, `getGreetingPhrase(hour)`
    - `formatTime`: return zero-padded HH:MM:SS string from a `Date` object
    - `formatDate`: return "Weekday, DD Month YYYY" string
    - `getGreetingPhrase`: map hour 0–23 → "Good Morning" (5–11), "Good Afternoon" (12–17), "Good Evening" (18–20), "Good Night" (21–23, 0–4)
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7, 1.8_


  - [x] 2.4 Implement `initGreeting()` and `renderGreeting()`
    - `renderGreeting`: read `new Date()`, write to `#clock`, `#date-display`, `#greeting-text`
    - `initGreeting`: call `renderGreeting()` immediately, then set `clockInterval = setInterval(renderGreeting, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9_

- [ ] 3. Implement Focus_Timer
  - [-] 3.1 Implement `formatSeconds(s)` pure function
    - Convert integer seconds (0–1500) to zero-padded "MM:SS" string
    - _Requirements: 2.3_


  - [ ] 3.4 Implement timer state functions: `startTimer()`, `stopTimer()`, `resetTimer()`, `tickTimer()`, `endTimer()`, `renderTimer()`
    - `timerState = { remainingSeconds: 1500, running: false, ended: false }`
    - `startTimer`: guard `running` flag, set `running = true`, start `timerInterval`
    - `stopTimer`: clear `timerInterval`, set `running = false`
    - `resetTimer`: call `stopTimer()`, restore `timerState` to initial, re-render
    - `tickTimer`: decrement `remainingSeconds`; if 0 call `endTimer()`; else re-render
    - `endTimer`: clear interval, `ended = true`, apply ended CSS class, disable `#timer-start`
    - `renderTimer`: update `#timer-display`, sync `disabled` states on `#timer-start`/`#timer-stop`/`#timer-reset`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ] 3.5 Implement `initFocusTimer()`
    - Render initial "25:00" via `renderTimer()`
    - Attach click listeners on `#timer-start`, `#timer-stop`, `#timer-reset`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Todo_List
  - [ ] 5.1 Implement `validateTaskText(text)` pure function
    - Return `{ valid: true }` for non-empty trimmed text ≤ 500 characters
    - Return `{ valid: false, error: '...' }` for empty/whitespace-only or length > 500
    - _Requirements: 3.3, 3.4, 4.4, 4.5_


  - [ ] 5.4 Implement `addTodo(text)`, `deleteTodo(id)`, `toggleTodo(id)` state-mutation functions
    - `addTodo`: call `validateTaskText`, push `{ id: generateId(), text: trimmed, completed: false }` to `todos`, call `persistTodos()`, call `renderTodoList()`
    - `deleteTodo`: filter `todos` by id, persist, re-render
    - `toggleTodo`: flip `completed` flag on matching id, persist, re-render
    - _Requirements: 3.2, 3.5, 5.2, 5.3, 5.5, 6.1_


  - [ ] 5.6 Implement `beginEditTodo(id)`, `confirmEditTodo(id, newText)`, `cancelEditTodo(id)`
    - `beginEditTodo`: swap text `<span>` with `<input>` pre-populated with current text, focus input
    - `confirmEditTodo`: if empty/whitespace → discard and re-render; if > 500 chars → show error, block save; else trim, update, persist, re-render
    - `cancelEditTodo`: re-render without changes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 5.7 Implement `renderTodoList()` and `initTodoList()`
    - `renderTodoList`: full re-render of `#todo-items` UL; each `<li>` has checkbox, text `<span>`, edit button, delete button; empty-state placeholder if `todos.length === 0`; strikethrough class on completed tasks
    - `initTodoList`: call `loadFromStorage('dashboard_todos')`, assign to `todos`, call `renderTodoList()`, wire `#todo-form` submit, wire delegated `click` and `keydown` on `#todo-items` (Enter = save, Escape = cancel)
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 4.1, 4.2, 5.1, 5.4, 6.2, 6.3_


- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Quick_Links
  - [ ] 8.1 Implement `validateLinkLabel(label)` and `validateLinkUrl(url)` pure functions
    - `validateLinkLabel`: non-empty after trim, ≤ 100 characters
    - `validateLinkUrl`: non-empty, begins with `http://` or `https://`, ≤ 2048 characters
    - _Requirements: 8.3, 8.4_


  - [ ] 8.4 Implement `addLink(label, url)`, `deleteLink(id)` state-mutation functions
    - `addLink`: validate both fields, push `{ id: generateId(), label: trimmed, url }` to `links`, call `persistLinks()`, call `renderQuickLinks()`
    - `deleteLink`: filter `links` by id, persist, re-render
    - _Requirements: 8.2, 8.6, 9.1_


  - [ ] 8.6 Implement `renderQuickLinks()` and `initQuickLinks()`
    - `renderQuickLinks`: full re-render of `#links-grid`; each link renders as a `<button>` (opens URL in new tab via `window.open(url, '_blank')`) + delete icon button; empty-state placeholder if `links.length === 0`
    - `initQuickLinks`: call `loadFromStorage('dashboard_links')`, assign to `links`, call `renderQuickLinks()`, wire `#links-form` submit (validate both fields, show `#link-label-validation` / `#link-url-validation` on error, clear inputs on success), wire delegated delete click on `#links-grid`
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.2, 9.3_

- [ ] 9. Wire up DOMContentLoaded and apply visual design
  - Add `DOMContentLoaded` listener in the IIFE that calls `initStorage()` (assign loaded data to module variables), then `initGreeting()`, `initFocusTimer()`, `initTodoList()`, `initQuickLinks()` in order
  - Apply CSS: widget card styles (border/background separation), strikethrough for completed tasks, ended-state colour for timer display, validation message styles, responsive single-column layout at ≤ 768px, minimum 14px font size everywhere, WCAG 2.1 AA colour contrast (≥ 4.5:1 normal text, ≥ 3:1 large text)
  - _Requirements: 10.6, 10.7, 11.1, 11.2, 11.3, 11.4_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All property-based tests use Vitest + fast-check (`tests/` directory, excluded from the deployed file set)
- Each property test maps 1-to-1 to a Correctness Property in the design document
- Checkpoints ensure incremental validation after each major phase
- The IIFE structure means pure functions (`formatTime`, `formatDate`, `getGreetingPhrase`, `formatSeconds`, `validateTaskText`, `validateLinkLabel`, `validateLinkUrl`) must be exported or extracted for testing — a thin test-helper wrapper is acceptable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2", "3.3", "5.1"] },
    { "id": 2, "tasks": ["2.4", "3.4", "5.2", "5.3", "8.1"] },
    { "id": 3, "tasks": ["3.5", "5.4", "8.2", "8.3"] },
    { "id": 4, "tasks": ["5.5", "5.6", "8.4"] },
    { "id": 5, "tasks": ["5.7", "6.1", "6.2", "6.3", "8.5"] },
    { "id": 6, "tasks": ["8.6"] },
    { "id": 7, "tasks": ["9"] }
  ]
}
```
