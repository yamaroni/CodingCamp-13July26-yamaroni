# Design Document

## Todo List Life Dashboard

---

## Overview

The Todo List Life Dashboard is a single-page, fully client-side web application built with plain HTML, CSS, and Vanilla JavaScript. It provides four productivity widgets — a live greeting display, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access link bar — all wired together in one file set with zero external dependencies.

**Key design goals:**
- Zero build step: open `index.html` directly in any modern browser and it works.
- One HTML entry point, exactly one CSS file (`css/style.css`), exactly one JS file (`js/app.js`).
- All state is stored in `localStorage` under two fixed keys (`dashboard_todos`, `dashboard_links`).
- Every user interaction reflects its result within 100ms; every clock tick updates within 100ms of the second boundary.
- WCAG 2.1 AA colour contrast throughout; responsive single-column layout below 768px.

**Technology choices:**
- No frameworks, no bundlers, no CDN links for runtime code — the production file set is self-contained.
- `setInterval` drives the clock (1000ms tick) and the focus timer countdown (1000ms tick).
- `localStorage` is accessed synchronously; writes happen immediately after every state-changing event.
- DOM manipulation is imperative and direct — no virtual DOM, no reactive bindings.

---

## Architecture

The application follows a single-module architecture: all logic lives in `js/app.js`, which is loaded as a plain `<script>` tag at the bottom of `index.html`. There is no module bundler, so the file uses a self-contained IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope.

### High-Level Structure

```
index.html          ← single HTML page; widget markup; links css/style.css and js/app.js
css/
  style.css         ← all styling, responsive breakpoints, theme tokens
js/
  app.js            ← all application logic, wrapped in one IIFE
```

### Runtime Lifecycle

```
Browser loads index.html
  └── DOMContentLoaded fires
        ├── initStorage()       — load todos + links from localStorage
        ├── initGreeting()      — start clock interval, render greeting
        ├── initFocusTimer()    — render "25:00", wire controls
        ├── initTodoList()      — render saved tasks, wire form + list events
        └── initQuickLinks()    — render saved links, wire form + list events
```

### Event Flow

All user interactions use delegated event listeners on each widget's container element. This avoids re-attaching listeners every time the list re-renders. State changes always follow the same pattern:

```
User event → update in-memory state object → persist to localStorage → re-render affected DOM section
```

### Interval Management

Two `setInterval` handles are tracked in module-scope variables:

| Variable          | Purpose                         | Tick rate |
|-------------------|---------------------------------|-----------|
| `clockInterval`   | Clock/greeting update           | 1000ms    |
| `timerInterval`   | Focus timer countdown           | 1000ms    |

`timerInterval` is started on "Start", cleared on "Stop" and "Reset", and cleared automatically when `remainingSeconds` reaches 0.

---

## Components and Interfaces

Each widget maps to a section of HTML markup and a corresponding `init*` function in `js/app.js`.

### 1. Greeting_Widget

**HTML anchor:** `<section id="greeting-widget">`

**Functions:**

| Function              | Responsibility |
|-----------------------|----------------|
| `initGreeting()`      | Start `clockInterval`; call `renderGreeting()` immediately |
| `renderGreeting()`    | Read `new Date()`, format time/date strings, pick greeting phrase, update DOM |
| `getGreetingPhrase(hour)` | Pure function — map hour (0–23) → greeting string |
| `formatTime(date)`    | Pure function — return zero-padded HH:MM:SS string |
| `formatDate(date)`    | Pure function — return "Weekday, DD Month YYYY" string |

**DOM elements written:**
- `#clock` — HH:MM:SS text
- `#date-display` — formatted date string
- `#greeting-text` — greeting phrase

**No state persisted** — derived entirely from `new Date()` on every tick.

---

### 2. Focus_Timer

**HTML anchor:** `<section id="focus-timer">`

**In-memory state object:**

```js
timerState = {
  remainingSeconds: 1500,  // 25 * 60
  running: false,
  ended: false
}
```

**Functions:**

| Function              | Responsibility |
|-----------------------|----------------|
| `initFocusTimer()`    | Render initial "25:00"; wire click listeners on #timer-start, #timer-stop, #timer-reset |
| `startTimer()`        | Set `running = true`, start `timerInterval` |
| `stopTimer()`         | Clear `timerInterval`, set `running = false` |
| `resetTimer()`        | Clear `timerInterval`, reset `timerState` to initial values, re-render |
| `tickTimer()`         | Decrement `remainingSeconds`; if 0: `endTimer()`; else re-render |
| `endTimer()`          | Clear interval, set `ended = true`, apply ended CSS class, disable start button |
| `renderTimer()`       | Format `remainingSeconds` to MM:SS, update `#timer-display`; sync button disabled states |
| `formatSeconds(s)`    | Pure function — convert integer seconds → zero-padded MM:SS string |

**DOM elements:**
- `#timer-display` — MM:SS or ended state text
- `#timer-start` — Start button (disabled when `ended`)
- `#timer-stop` — Stop button
- `#timer-reset` — Reset button

---

### 3. Todo_List

**HTML anchor:** `<section id="todo-list">`

**In-memory state:**

```js
todos = [
  { id: string,  // crypto.randomUUID() or Date.now() fallback
    text: string,
    completed: boolean }
]
```

**Functions:**

| Function                        | Responsibility |
|---------------------------------|----------------|
| `initTodoList()`                | Load from storage; render; wire form submit + delegated list events |
| `addTodo(text)`                 | Validate, create todo object, push to `todos`, persist, re-render |
| `deleteTodo(id)`                | Filter `todos` by id, persist, re-render |
| `toggleTodo(id)`                | Flip `completed` flag, persist, re-render |
| `beginEditTodo(id)`             | Swap text element for inline `<input>`, populate value, focus |
| `confirmEditTodo(id, newText)`  | Validate; if valid trim+update; else discard; re-render |
| `cancelEditTodo(id)`            | Re-render without changes |
| `renderTodoList()`              | Full re-render of `#todo-items` UL from `todos` array |
| `validateTaskText(text)`        | Pure function — return `{ valid, error }` |
| `persistTodos()`                | `localStorage.setItem('dashboard_todos', JSON.stringify(todos))` |

**DOM elements:**
- `#todo-form` — form with `#todo-input` and submit button
- `#todo-validation` — inline validation message span
- `#todo-items` — `<ul>` re-rendered on every change
- Each `<li>` contains: checkbox, text `<span>` (or edit `<input>`), edit button, delete button

**Delegated event listeners** on `#todo-items` handle `click` (toggle, delete, edit, save, cancel) and `keydown` (Enter = save, Escape = cancel).

---

### 4. Quick_Links

**HTML anchor:** `<section id="quick-links">`

**In-memory state:**

```js
links = [
  { id: string,
    label: string,
    url: string }
]
```

**Functions:**

| Function                  | Responsibility |
|---------------------------|----------------|
| `initQuickLinks()`        | Load from storage; render; wire form submit + delegated delete events |
| `addLink(label, url)`     | Validate; create link object; push to `links`; persist; re-render |
| `deleteLink(id)`          | Filter `links`, persist, re-render |
| `renderQuickLinks()`      | Full re-render of `#links-grid` from `links` array |
| `validateLinkLabel(label)`| Pure function — return `{ valid, error }` |
| `validateLinkUrl(url)`    | Pure function — return `{ valid, error }` |
| `persistLinks()`          | `localStorage.setItem('dashboard_links', JSON.stringify(links))` |

**DOM elements:**
- `#links-form` — form with `#link-label-input`, `#link-url-input`, submit button
- `#link-label-validation`, `#link-url-validation` — inline validation spans
- `#links-grid` — container re-rendered on every change
- Each link item: `<button>` (opens URL in new tab) + delete icon button

---

## Data Models

### Task Object

```js
{
  id:        string,   // crypto.randomUUID() — unique, stable across edits
  text:      string,   // trimmed, 1–500 characters
  completed: boolean   // false on creation
}
```

### Link Object

```js
{
  id:    string,  // crypto.randomUUID()
  label: string,  // trimmed, 1–100 characters
  url:   string   // begins with "http://" or "https://", max 2048 characters
}
```

### localStorage Layout

| Key               | Value type          | Contents                    |
|-------------------|---------------------|-----------------------------|
| `dashboard_todos` | JSON string → array | Array of Task objects       |
| `dashboard_links` | JSON string → array | Array of Link objects       |

**Write strategy:** Synchronous, immediate — `localStorage.setItem` is called after every state mutation before re-rendering. Because localStorage writes are synchronous, no debounce is needed; writes complete well within the 500ms requirement.

**Read strategy (on load):**

```js
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];      // no data — start empty, no error
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch (e) {
    showStorageError(key);            // display inline error message
    return [];                        // discard and start empty
  }
}
```

**ID generation:**

```js
function generateId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting phrase covers every hour

*For any* hour value in the range 0–23, `getGreetingPhrase(hour)` SHALL return exactly one of the four greeting strings ("Good Morning", "Good Afternoon", "Good Evening", "Good Night") — never `undefined`, never an empty string, and the returned greeting SHALL correspond to the correct hour range as specified.

**Validates: Requirements 1.5, 1.6, 1.7, 1.8**

---

### Property 2: Timer format is a reversible encoding

*For any* integer `s` in the range 0–1500 (inclusive), `formatSeconds(s)` SHALL return a string of the form `"MM:SS"` where `MM` and `SS` are zero-padded two-digit integers, and `parseInt(MM) * 60 + parseInt(SS) === s` (i.e., the encoding is fully reversible).

**Validates: Requirements 2.3**

---

### Property 3: Task addition appends in order with correct initial state

*For any* `todos` array of length n and any valid task text (non-empty after trim, ≤ 500 characters, not whitespace-only), calling `addTodo(text)` SHALL result in a `todos` array of length n + 1 where the new element is at index n (bottom of list), its `text` equals the trimmed input, and its `completed` is `false`. All pre-existing elements SHALL retain their original order, `id`, `text`, and `completed` values.

**Validates: Requirements 3.2, 3.5**

---

### Property 4: Whitespace-only input is always rejected

*For any* string composed entirely of whitespace characters (spaces `\u0020`, tabs `\u0009`, newlines `\u000A`, carriage returns `\u000D`), calling `addTodo(text)` SHALL leave the `todos` array unchanged (same length, same elements) and SHALL not write any new item to `localStorage`.

**Validates: Requirements 3.3**

---

### Property 5: Completion toggle is an involution

*For any* task object with a given `id` and `completed` state, calling `toggleTodo(id)` twice in succession SHALL return the task to its original `completed` state, leaving `id` and `text` unchanged. This holds regardless of whether the task starts as complete or incomplete.

**Validates: Requirements 5.2, 5.3**

---

### Property 6: Task collection survives a localStorage round-trip

*For any* array of task objects (each with `id`, `text`, `completed` fields), serialising via `persistTodos()` and then loading via `loadFromStorage('dashboard_todos')` SHALL yield an array that is deeply equal to the original — same length, same `id`, `text`, and `completed` values in the same insertion order.

**Validates: Requirements 6.1, 6.2**

---

### Property 7: Link collection survives a localStorage round-trip

*For any* array of link objects (each with `id`, `label`, `url` fields), serialising via `persistLinks()` and then loading via `loadFromStorage('dashboard_links')` SHALL yield an array that is deeply equal to the original — same length, same `id`, `label`, and `url` values in the same insertion order.

**Validates: Requirements 9.1, 9.2**

---

### Property 8: URL validation rejects any non-http(s) scheme

*For any* string that does NOT begin with `"http://"` or `"https://"` (including the empty string, whitespace-only strings, relative paths, `ftp://` URLs, and arbitrarily long strings with a non-http prefix), `validateLinkUrl(url)` SHALL return `{ valid: false }` and `addLink` SHALL leave the `links` array unchanged.

**Validates: Requirements 8.4**

---

### Property 9: Task and edit text length boundary

*For any* string whose trimmed length is exactly 500 characters, `validateTaskText(text)` SHALL return `{ valid: true }`. For any string whose trimmed length is 501 or more characters, `validateTaskText(text)` SHALL return `{ valid: false }`. This boundary applies identically to both new-task creation and in-place editing.

**Validates: Requirements 3.4, 4.5**

---

### Property 10: Deleting a task removes exactly that task and preserves all others

*For any* `todos` array of length n (n ≥ 1) containing a task with a specific `id`, calling `deleteTodo(id)` SHALL result in an array of length n - 1 where no element has that `id`, and every remaining element retains its original `id`, `text`, and `completed` value in its original relative order.

**Validates: Requirements 5.5**

---

### Property 11: Deleting a link removes exactly that link and preserves all others

*For any* `links` array of length n (n ≥ 1) containing a link with a specific `id`, calling `deleteLink(id)` SHALL result in an array of length n - 1 where no element has that `id`, and every remaining element retains its original `id`, `label`, and `url` value in its original relative order.

**Validates: Requirements 8.6**

---

## Error Handling

### localStorage Errors

| Scenario | Behaviour |
|---|---|
| Key absent (`getItem` returns `null`) | Silently start with empty array; no error message shown |
| Value not valid JSON | Catch `JSON.parse` exception; show inline "could not load" error; use empty array |
| Value is valid JSON but not an array | Throw manually, caught by same handler; same behaviour as malformed |
| `setItem` throws (storage quota exceeded) | Catch exception; show transient error banner; state is still updated in memory |

### Input Validation Errors

All validation errors are surfaced as inline messages adjacent to the relevant input field. They are cleared on the next successful interaction. No modal dialogs, no alerts.

| Input | Validation rules |
|---|---|
| Task text | Non-empty after trim; ≤ 500 characters |
| Edit text | If empty/whitespace after trim: discard and return to display mode (no error shown); if > 500 chars: show error, block save |
| Link label | Non-empty after trim; ≤ 100 characters |
| Link URL | Non-empty; begins with `http://` or `https://`; ≤ 2048 characters |

### Timer Edge Cases

- Double-click on Start: guarded by the `running` flag — a second `startTimer()` call while `running === true` is a no-op.
- Reset while running: `stopTimer()` is called internally before resetting state.
- Interval drift: `setInterval` may drift by a few milliseconds per tick. This is acceptable for a productivity timer; no drift correction is implemented.

### ID Collision

`crypto.randomUUID()` is collision-resistant by specification. The fallback (`Date.now() + Math.random()`) is not cryptographically strong but is sufficient for a client-side todo list used by one person in one browser.

---

## Testing Strategy

### Overview

Because this is a Vanilla JS application with no build step, tests are structured around the pure functions and state-mutation functions that can be unit-tested in isolation, plus property-based tests for the universally quantified correctness properties above.

**Recommended test runner:** [Vitest](https://vitest.dev/) (zero-config, ESM-friendly, runs in Node). For the no-build constraint in production, tests live in a `tests/` directory that is excluded from the deployed file set. Alternatively, the pure functions can be extracted to testable form with a thin wrapper.

**Property-based testing library:** [fast-check](https://fast-check.io/) (works with Vitest, no browser required).

---

### Unit Tests (example-based)

| Test | Target function | Scenario |
|---|---|---|
| Clock format | `formatTime` | Midnight → "00:00:00" |
| Clock format | `formatTime` | 09:05:03 → "09:05:03" |
| Date format | `formatDate` | Known date → correct string |
| Greeting | `getGreetingPhrase` | Hour 0 → "Good Night" |
| Greeting | `getGreetingPhrase` | Hour 5 → "Good Morning" |
| Greeting | `getGreetingPhrase` | Hour 12 → "Good Afternoon" |
| Greeting | `getGreetingPhrase` | Hour 18 → "Good Evening" |
| Timer format | `formatSeconds` | 0 → "00:00" |
| Timer format | `formatSeconds` | 1500 → "25:00" |
| Timer format | `formatSeconds` | 247 → "04:07" |
| Task validation | `validateTaskText` | Empty string → invalid |
| Task validation | `validateTaskText` | "  " → invalid (whitespace-only) |
| Task validation | `validateTaskText` | 500-char string → valid |
| Task validation | `validateTaskText` | 501-char string → invalid |
| Link URL validation | `validateLinkUrl` | "https://example.com" → valid |
| Link URL validation | `validateLinkUrl` | "ftp://x.com" → invalid |
| Link URL validation | `validateLinkUrl` | "" → invalid |
| Storage load | `loadFromStorage` | Null → empty array, no error |
| Storage load | `loadFromStorage` | Malformed JSON → empty array + error |
| Storage load | `loadFromStorage` | Valid JSON non-array → empty array + error |

---

### Property-Based Tests

Each test maps to one Correctness Property. All tests run a minimum of **100 iterations** via fast-check's `fc.assert(fc.property(...))`.

Tag format: `// Feature: todo-list-life-dashboard, Property {N}: {property_text}`

| Test | Property | Generator(s) | Assertion |
|---|---|---|---|
| Greeting covers all hours | Property 1 | `fc.integer({ min: 0, max: 23 })` | Result is one of the four valid strings and matches the correct hour range |
| Timer format is reversible | Property 2 | `fc.integer({ min: 0, max: 1500 })` | Parsed MM×60+SS equals input |
| Add appends in order with correct state | Property 3 | Valid task text + arbitrary todos array | Length n+1; last item is new task; prior items unchanged in order |
| Whitespace rejected | Property 4 | `fc.stringOf(fc.constantFrom(' ','\t','\n','\r'))` | todos array unchanged; localStorage not updated with new item |
| Toggle is involution | Property 5 | Arbitrary todo object | Double toggle restores original completed state; id and text unchanged |
| Todos persistence round-trip | Property 6 | Arbitrary array of task objects | Deserialised array is deeply equal to original |
| Links persistence round-trip | Property 7 | Arbitrary array of link objects | Deserialised array is deeply equal to original |
| Non-http URL rejected | Property 8 | Strings not prefixed with `http://` or `https://` | `validateLinkUrl` returns `{ valid: false }`; links array unchanged |
| Text length boundary | Property 9 | Strings at exactly 500 and 501 trimmed chars | 500 → valid; 501 → invalid |
| Delete task removes exactly one | Property 10 | Arbitrary todos array (n ≥ 1) + random index i | Length n-1; todos[i] absent; all others in original relative order with original state |
| Delete link removes exactly one | Property 11 | Arbitrary links array (n ≥ 1) + random index i | Length n-1; links[i] absent; all others in original relative order with original state |

---

### Integration / Smoke Tests

These verify wiring rather than logic; run manually or with a browser-automation tool (e.g., Playwright):

- Dashboard renders all four widgets with no console errors on first load (clean localStorage).
- After adding a task, reloading the page shows the task persisted.
- After adding a link, reloading the page shows the link persisted.
- Timer counts down from 25:00 to 24:59 after clicking Start.
- Timer shows ended state at 00:00 and Start button is disabled.
- Link button opens URL in a new tab.

---

### Accessibility Checks

- Run axe-core or Lighthouse against `index.html` to verify WCAG 2.1 AA contrast.
- Verify all interactive controls are keyboard-reachable (Tab order follows visual order).
- Verify all buttons have accessible names (text content or `aria-label`).
