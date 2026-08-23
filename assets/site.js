(function () {
  "use strict";
  var KEY = "rl-theme";
  var root = document.documentElement;

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : null; } catch (e) { return null; }
  }
  function current() { return stored() || "light"; }

  var btn = document.querySelector("[data-theme-toggle]");
  function label() { if (btn) btn.textContent = "[" + (current() === "dark" ? "light" : "dark") + "]"; }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label();
    });
    label();
  }

  // Los Angeles clock in the footer
  var clock = document.querySelector("[data-la-time]");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  // Academic year, derived from the UCSB start date so the intro never goes stale
  var yearEl = document.querySelector("[data-academic-year]");
  if (yearEl) {
    var now = new Date(), start = new Date(2026, 8, 1), text;
    if (now < start) {
      text = "Incoming first year";
    } else {
      var n = now.getFullYear() - 2026 + (now.getMonth() >= 8 ? 1 : 0);
      text = (["First year", "Second year", "Third year", "Fourth year"][Math.min(n, 4) - 1]) || "Fifth year";
    }
    yearEl.textContent = text;
  }
})();
