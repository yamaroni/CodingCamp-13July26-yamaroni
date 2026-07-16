# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub displayed in the browser, providing a greeting with live time and date, a Pomodoro-style focus timer, a persistent to-do list, and quick-access links to favourite websites. All data is stored in the browser's Local Storage — no backend server or external dependency is required. The application may be used as a standalone web page or packaged as a browser extension.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Todo_List**: The UI component that manages a collection of task items.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **Quick_Links**: The UI component that displays a collection of user-defined shortcut buttons linking to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Storage**: The browser's Local Storage API used for all client-side persistence.
- **Modern Browser**: Chrome, Firefox, Edge, or Safari at a currently supported release version.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a user, I want to see the current time, date, and a personalised greeting when I open the Dashboard, so that I am immediately oriented and welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS (24-hour) format, updated every second.
2. WHEN the local clock crosses a second boundary, THE Greeting_Widget SHALL update the displayed time within 100ms of that boundary.
3. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 14 July 2025").
4. WHEN the local date changes (midnight boundary), THE Greeting_Widget SHALL update the displayed date within one second.
5. IF the local time hour is between 05 and 11 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
6. IF the local time hour is between 12 and 17 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
7. IF the local time hour is between 18 and 20 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
8. IF the local time hour is between 21 and 23 (inclusive) or between 00 and 04 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Night".
9. WHEN the local time transitions between greeting periods (e.g., 11:59:59 → 12:00:00), THE Greeting_Widget SHALL update the greeting message within one second of the transition.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise to a countdown value of 25 minutes and display "25:00" when the Dashboard first loads.
2. WHEN the user activates the start control and the timer is not already counting down, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in zero-padded MM:SS format (e.g., "04:07").
4. WHEN the Focus_Timer is counting down and the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the exact remaining time.
5. WHEN the Focus_Timer is paused or at its initial state and the user activates the start control, THE Focus_Timer SHALL resume or begin the countdown from the currently displayed time.
6. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and return the display to "25:00".
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop counting, and the display SHALL change to a visually distinct ended state (e.g., a different text colour or a "Session complete" message).
8. WHILE the Focus_Timer displays 00:00 in the ended state, THE start control SHALL be disabled so the user cannot restart without first resetting.
9. WHILE the Focus_Timer is paused or stopped (and not in the ended state), THE start control SHALL be enabled and interactable.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to my to-do list and see them displayed, so that I can keep track of what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field (maximum 500 characters) and a submit control for entering new task text.
2. WHEN the user submits a non-empty task text, THE Todo_List SHALL trim leading and trailing whitespace, append the new Task to the bottom of the list, and clear the input field.
3. IF the user attempts to submit an empty or whitespace-only input, THEN THE Todo_List SHALL not create a Task, SHALL display an inline validation message, and SHALL retain focus on the input field.
4. IF the user attempts to submit task text exceeding 500 characters, THEN THE Todo_List SHALL not create a Task and SHALL display an inline validation message indicating the character limit.
5. THE Todo_List SHALL display all Tasks in the order they were added (oldest at top, newest at bottom).
6. THE Todo_List SHALL apply a strikethrough style to the text of completed Tasks to visually distinguish them from incomplete Tasks.
7. IF no Tasks exist in the list, THEN THE Todo_List SHALL display a placeholder message indicating the list is empty.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct or update what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an edit control for each Task.
2. WHEN the user activates the edit control for a Task, THE Todo_List SHALL replace the Task's text display with an editable input (maximum 500 characters) pre-populated with the current task text, and SHALL move keyboard focus to that input.
3. WHEN the user confirms the edit (e.g., presses Enter or clicks a save control) with a non-empty value, THE Todo_List SHALL trim leading and trailing whitespace, update the Task's text to the trimmed value, and return to display mode.
4. IF the user confirms the edit with an empty or whitespace-only value, THEN THE Todo_List SHALL discard the change and return to display mode with the original text.
5. IF the user confirms the edit with a value exceeding 500 characters, THEN THE Todo_List SHALL not save the change and SHALL display an inline validation message indicating the character limit.
6. WHEN the user cancels the edit (e.g., presses Escape), THE Todo_List SHALL discard the change and return to display mode with the original text.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can manage my list effectively.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle control (e.g., a checkbox) for each Task, regardless of its completion state.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL mark the Task as complete and apply a strikethrough style to the Task's text.
3. WHEN the user activates the completion toggle for a complete Task, THE Todo_List SHALL mark the Task as incomplete and remove the strikethrough style from the Task's text.
4. THE Todo_List SHALL provide a delete control for each Task, regardless of its completion state.
5. WHEN the user activates the delete control for a Task, THE Todo_List SHALL immediately remove that Task from the list without a confirmation prompt, and the remaining Tasks SHALL preserve their original order and completion states.

---

### Requirement 6: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my list is still there when I reload or revisit the Dashboard.

#### Acceptance Criteria

1. WHEN any Task is added, edited, completed, uncompleted, or deleted, THE Todo_List SHALL write the current task collection to Storage under the fixed key `dashboard_todos` within 500ms of the change.
2. WHEN the Dashboard loads, THE Todo_List SHALL read the task collection from Storage under key `dashboard_todos` and render all previously saved Tasks before allowing user interaction.
3. IF no data exists in Storage under `dashboard_todos` on load, THEN THE Todo_List SHALL render an empty list and display the empty-state placeholder without any error message.
4. IF the data retrieved from Storage under `dashboard_todos` is malformed or cannot be parsed, THEN THE Todo_List SHALL discard the invalid data, render an empty list, and display an inline error message indicating that saved tasks could not be loaded.
5. THE Storage key `dashboard_todos` SHALL be a fixed, non-empty string constant that remains identical across all sessions.

---

### Requirement 7: Quick Links — Display and Navigation

**User Story:** As a user, I want a set of quick-link buttons that open my favourite websites, so that I can navigate to them with a single click.

#### Acceptance Criteria

1. THE Quick_Links SHALL display each saved Link as a button labelled with the Link's saved name.
2. WHEN the user activates a Link button (via click or keyboard Enter/Space), THE Dashboard SHALL open the associated URL in a new browser tab without closing or navigating away from the Dashboard tab.
3. IF no Links have been saved, THEN THE Quick_Links section SHALL display a placeholder prompt (e.g., "No links added yet") occupying the same layout space as the link buttons.

---

### Requirement 8: Quick Links — Add and Delete Links

**User Story:** As a user, I want to add and remove quick-link entries, so that I can customise my shortcut bar.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a text input for a link label (maximum 100 characters), a text input for a URL (maximum 2048 characters), and a submit control.
2. WHEN the user submits a non-empty label and a valid URL (beginning with "http://" or "https://"), THE Quick_Links SHALL add the new Link to the collection, display it immediately, and clear both input fields.
3. IF the user submits a missing or whitespace-only label, THEN THE Quick_Links SHALL not create the Link and SHALL display an inline validation message on the label field.
4. IF the user submits a missing URL, a URL not beginning with "http://" or "https://", or a URL exceeding 2048 characters, THEN THE Quick_Links SHALL not create the Link and SHALL display an inline validation message on the URL field.
5. THE Quick_Links SHALL provide a delete control for each Link.
6. WHEN the user activates the delete control for a Link, THE Quick_Links SHALL immediately and permanently remove that Link from the collection without a confirmation prompt.

---

### Requirement 9: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are available every time I open the Dashboard.

#### Acceptance Criteria

1. WHEN any Link is added or deleted, THE Quick_Links SHALL write the current link collection to Storage under the fixed key `dashboard_links` within 500ms of the change.
2. WHEN the Dashboard loads, THE Quick_Links SHALL read the link collection from Storage under key `dashboard_links` and render all previously saved Links before allowing user interaction.
3. IF no data exists in Storage under `dashboard_links` on load, THEN THE Quick_Links SHALL render the empty-state placeholder without any error message.
4. IF the data retrieved from Storage under `dashboard_links` is malformed or cannot be parsed, THEN THE Quick_Links SHALL discard the invalid data, render the empty-state placeholder, and display an inline error message indicating that saved links could not be loaded.
5. THE Storage key `dashboard_links` SHALL be a fixed, non-empty string constant that remains identical across all sessions.

---

### Requirement 10: Technical Constraints and Compatibility

**User Story:** As a developer, I want the Dashboard to be built with plain HTML, CSS, and Vanilla JavaScript with a clean file structure, so that it has no external dependencies and runs reliably in any modern browser.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript; no third-party frameworks, libraries, or build tools SHALL be included in the production file set.
2. THE Dashboard SHALL function correctly — meaning all UI interactions produce correct results with no JavaScript console errors — in current stable releases of Chrome, Firefox, Edge, and Safari.
3. THE Dashboard SHALL not require a backend server; all application logic, data storage, and retrieval SHALL be performed exclusively using client-side browser APIs.
4. THE Dashboard SHALL contain exactly one CSS file located inside a `css/` directory relative to the entry HTML file.
5. THE Dashboard SHALL contain exactly one JavaScript file located inside a `js/` directory relative to the entry HTML file.
6. WHEN the Dashboard page loads on a device with a CPU released within the last five years and a standard broadband connection, THE Dashboard SHALL display all widgets and be fully interactive within 500ms.
7. WHEN the user interacts with any widget control, THE Dashboard SHALL reflect the resulting state change in the UI within 100ms.

---

### Requirement 11: Visual Design and Layout

**User Story:** As a user, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL render each widget (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) inside a visually separated container (e.g., a card with a border or distinct background colour) so that each section is unambiguously identifiable.
2. THE Dashboard SHALL apply a minimum font size of 14px to all body text, labels, and input fields.
3. THE Dashboard SHALL be responsive: at viewport widths below 768px, all widget containers SHALL stack in a single column with no horizontal overflow, clipping, or overlapping elements.
4. THE Dashboard SHALL maintain a colour contrast ratio of at least 4.5:1 between text and its background for normal text (below 18pt / 24px) and at least 3:1 for large text (18pt / 24px and above), conforming to WCAG 2.1 Level AA criterion 1.4.3.
