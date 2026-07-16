/**
 * Todo List Life Dashboard
 * Single IIFE — all application logic is module-scoped.
 * Requirements: 10.1, 10.3, 10.4, 10.5
 */
(function () {
  'use strict';

  /* ============================================================
     Module-scope state variables
     ============================================================ */

  /** @type {number|null} setInterval handle for the live clock */
  var clockInterval = null;

  /** @type {number|null} setInterval handle for the focus timer countdown */
  var timerInterval = null;

  /**
   * Focus timer state
   * @type {{ remainingSeconds: number, running: boolean, ended: boolean }}
   */
  var timerState = {
    remainingSeconds: 1500, // 25 * 60
    running: false,
    ended: false
  };

  /**
   * In-memory task collection
   * @type {Array<{ id: string, text: string, completed: boolean }>}
   */
  var todos = [];

  /**
   * In-memory quick-links collection
   * @type {Array<{ id: string, label: string, url: string }>}
   */
  var links = [];

  /* ============================================================
     Shared Utilities
     ============================================================ */

  /**
   * Generate a unique identifier.
   * Uses crypto.randomUUID() when available; falls back to a
   * timestamp + random-base-36 string for older environments.
   *
   * @returns {string}
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: Date.now() hex + Math.random() base-36 suffix
    return String(Date.now()) + Math.random().toString(36).slice(2);
  }

  /**
   * Show an inline storage-error message inside the widget that owns
   * the given storage key.
   *
   * @param {string} key - The localStorage key that failed to load.
   */
  function showStorageError(key) {
    var containerId;
    var message;

    if (key === 'dashboard_todos') {
      containerId = 'todo-list';
      message = 'Saved tasks could not be loaded. Starting with an empty list.';
    } else if (key === 'dashboard_links') {
      containerId = 'quick-links';
      message = 'Saved links could not be loaded. Starting with an empty list.';
    } else {
      // Generic fallback for any unexpected key
      containerId = null;
      message = 'Saved data for "' + key + '" could not be loaded.';
    }

    var errorEl = document.createElement('p');
    errorEl.className = 'storage-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = message;

    if (containerId) {
      var container = document.getElementById(containerId);
      if (container) {
        // Prepend inside the widget card, after the heading
        var heading = container.querySelector('.widget-title');
        if (heading && heading.nextSibling) {
          container.insertBefore(errorEl, heading.nextSibling);
        } else {
          container.appendChild(errorEl);
        }
        return;
      }
    }

    // Last-resort: prepend to body
    document.body.insertBefore(errorEl, document.body.firstChild);
  }

  /**
   * Load and parse an array from localStorage.
   * Requirements: 6.4, 9.4
   *
   * - If the key is absent, returns [] silently.
   * - If the value is malformed JSON or not an array, calls
   *   showStorageError(key) and returns [].
   *
   * @param {string} key - The localStorage key to read.
   * @returns {Array}
   */
  function loadFromStorage(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) {
        // No data stored yet — start empty, no error shown
        return [];
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Stored value is not an array');
      }
      return parsed;
    } catch (e) {
      showStorageError(key);
      return [];
    }
  }

  /**
   * Persist the current todos array to localStorage.
   * Requirement: 6.1
   */
  function persistTodos() {
    localStorage.setItem('dashboard_todos', JSON.stringify(todos));
  }

  /**
   * Persist the current links array to localStorage.
   * Requirement: 9.1
   */
  function persistLinks() {
    localStorage.setItem('dashboard_links', JSON.stringify(links));
  }

  /* ============================================================
     Greeting Widget — stubs (implemented in Task 2)
     ============================================================ */

  /**
   * Format a Date object as a zero-padded HH:MM:SS string (24-hour).
   * Requirements: 1.1
   *
   * @param {Date} date
   * @returns {string} e.g. "09:05:03"
   */
  function formatTime(date) {
    var h = String(date.getHours()).padStart(2, '0');
    var m = String(date.getMinutes()).padStart(2, '0');
    var s = String(date.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  /**
   * Format a Date object as "Weekday, DD Month YYYY".
   * Requirements: 1.3
   *
   * @param {Date} date
   * @returns {string} e.g. "Monday, 14 July 2025"
   */
  function formatDate(date) {
    var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    var weekday = WEEKDAYS[date.getDay()];
    var day = String(date.getDate()).padStart(2, '0');
    var month = MONTHS[date.getMonth()];
    var year = date.getFullYear();
    return weekday + ', ' + day + ' ' + month + ' ' + year;
  }

  /**
   * Map an hour value (0–23) to the appropriate greeting string.
   * Requirements: 1.5, 1.6, 1.7, 1.8
   *
   *  5–11  → "Good Morning"
   * 12–17  → "Good Afternoon"
   * 18–20  → "Good Evening"
   * 21–23, 0–4 → "Good Night"
   *
   * @param {number} hour - Integer in range 0–23
   * @returns {string}
   */
  function getGreetingPhrase(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'Good Morning';
    }
    if (hour >= 12 && hour <= 17) {
      return 'Good Afternoon';
    }
    if (hour >= 18 && hour <= 20) {
      return 'Good Evening';
    }
    // 21–23 and 0–4
    return 'Good Night';
  }

  /**
   * Read the current time and update the greeting widget DOM elements.
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  function renderGreeting() {
    var now = new Date();
    var clockEl = document.getElementById('clock');
    var dateEl = document.getElementById('date-display');
    var greetingEl = document.getElementById('greeting-text');

    if (clockEl) {
      clockEl.textContent = formatTime(now);
    }
    if (dateEl) {
      dateEl.textContent = formatDate(now);
    }
    if (greetingEl) {
      greetingEl.textContent = getGreetingPhrase(now.getHours());
    }
  }

  /**
   * Initialise the greeting widget: render immediately, then tick every second.
   * Requirements: 1.9
   */
  function initGreeting() {
    renderGreeting();
    clockInterval = setInterval(renderGreeting, 1000);
  }

  /* ============================================================
     Focus Timer — stubs (implemented in Task 3)
     ============================================================ */

  function formatSeconds(s) {
    // TODO: implement in Task 3.1
    void s;
    return '25:00';
  }

  function renderTimer() {
    // TODO: implement in Task 3.4
  }

  function startTimer() {
    // TODO: implement in Task 3.4
  }

  function stopTimer() {
    // TODO: implement in Task 3.4
  }

  function resetTimer() {
    // TODO: implement in Task 3.4
  }

  function tickTimer() {
    // TODO: implement in Task 3.4
  }

  function endTimer() {
    // TODO: implement in Task 3.4
  }

  function initFocusTimer() {
    // TODO: implement in Task 3.5
    renderTimer();
  }

  /* ============================================================
     Todo List — stubs (implemented in Task 5)
     ============================================================ */

  function validateTaskText(text) {
    // TODO: implement in Task 5.1
    void text;
    return { valid: true };
  }

  function renderTodoList() {
    // TODO: implement in Task 5.7
  }

  function addTodo(text) {
    // TODO: implement in Task 5.4
    void text;
  }

  function deleteTodo(id) {
    // TODO: implement in Task 5.4
    void id;
  }

  function toggleTodo(id) {
    // TODO: implement in Task 5.4
    void id;
  }

  function beginEditTodo(id) {
    // TODO: implement in Task 5.6
    void id;
  }

  function confirmEditTodo(id, newText) {
    // TODO: implement in Task 5.6
    void id; void newText;
  }

  function cancelEditTodo(id) {
    // TODO: implement in Task 5.6
    void id;
  }

  function initTodoList() {
    // TODO: implement in Task 5.7
    todos = loadFromStorage('dashboard_todos');
    renderTodoList();
  }

  /* ============================================================
     Quick Links — stubs (implemented in Task 8)
     ============================================================ */

  function validateLinkLabel(label) {
    // TODO: implement in Task 8.1
    void label;
    return { valid: true };
  }

  function validateLinkUrl(url) {
    // TODO: implement in Task 8.1
    void url;
    return { valid: true };
  }

  function renderQuickLinks() {
    // TODO: implement in Task 8.6
  }

  function addLink(label, url) {
    // TODO: implement in Task 8.4
    void label; void url;
  }

  function deleteLink(id) {
    // TODO: implement in Task 8.4
    void id;
  }

  function initQuickLinks() {
    // TODO: implement in Task 8.6
    links = loadFromStorage('dashboard_links');
    renderQuickLinks();
  }

  /* ============================================================
     Bootstrap — DOMContentLoaded
     ============================================================ */

  document.addEventListener('DOMContentLoaded', function () {
    initGreeting();
    initFocusTimer();
    initTodoList();
    initQuickLinks();
  });

  /* ============================================================
     Test helper exports
     Exposes pure functions for the Vitest test suite without
     polluting the global scope in production.
     (tests/ directory is excluded from the deployed file set)
     ============================================================ */
  if (typeof window !== 'undefined') {
    window.__dashboardTestExports__ = {
      generateId,
      loadFromStorage,
      persistTodos,
      persistLinks,
      formatTime,
      formatDate,
      getGreetingPhrase,
      formatSeconds,
      validateTaskText,
      validateLinkLabel,
      validateLinkUrl,
      // state accessors — tests can read/write via these refs
      getTodos: function () { return todos; },
      setTodos: function (arr) { todos = arr; },
      getLinks: function () { return links; },
      setLinks: function (arr) { links = arr; },
      addTodo,
      deleteTodo,
      toggleTodo,
      addLink,
      deleteLink,
      persistTodos,
      persistLinks
    };
  }

  // CommonJS export for Vitest test suite (Node environment)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      formatTime,
      formatDate,
      getGreetingPhrase,
      formatSeconds,
      generateId,
      validateTaskText,
      validateLinkLabel,
      validateLinkUrl
    };
  }

}());
