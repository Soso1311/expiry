/*
 * Expiry — compliance tracker for letting portfolios.
 *
 * Data lives in the visitor's own browser (localStorage). Nothing is uploaded.
 * Exposed as window.TRACKER so the behaviour can be tested without a browser.
 */
(function (global) {
  "use strict";

  var STORE = "expiry-tracker-v1";
  var SOON_DAYS = 60;
  var MS_DAY = 86400000;

  // Recurring obligations. `months` is the legal maximum interval.
  var CHECKS = [
    { id: "gas", label: "Gas Safety", months: 12, note: "Fine up to £6,000 per appliance, plus prosecution." },
    { id: "eicr", label: "EICR", months: 60, note: "Civil penalty up to £30,000 per breach." },
    { id: "epc", label: "EPC (band E+)", months: 120, note: "Civil penalty up to £5,000." },
    { id: "alarms", label: "Alarm check", months: 12, note: "Civil penalty up to £5,000." },
    { id: "legionella", label: "Legionella", months: 24, note: "HSE enforcement action." }
  ];

  // One-off obligations completed at the start of a tenancy.
  var START_CHECKS = [
    { id: "deposit", label: "Deposit protected", note: "Within 30 days of receipt." },
    { id: "howto", label: "How to Rent served", note: "Before the tenancy starts." },
    { id: "rtr", label: "Right to Rent", note: "Checked before move-in." },
    { id: "gasgiven", label: "Gas cert to tenant", note: "At the start of the tenancy." }
  ];

  // ── dates ────────────────────────────────────────────────────
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function today() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function shiftMonths(months) {
    var d = today();
    d.setMonth(d.getMonth() + months);
    return iso(d);
  }
  function addMonths(isoDate, months) {
    var d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + months);
    return d;
  }
  function daysFromNow(date) {
    return Math.round((date - today()) / MS_DAY);
  }
  function fmt(isoDate) {
    if (!isoDate) return "—";
    var d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  // Accepts what agency exports actually contain: ISO, UK day-first,
  // Excel serial numbers, "12 Mar 2023".
  function parseDate(value) {
    if (value === null || value === undefined) return "";
    var s = String(value).trim();
    if (!s) return "";

    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + "-" + pad2(+m[2]) + "-" + pad2(+m[3]);

    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      var a = +m[1], b = +m[2], y = +m[3];
      if (y < 100) y += (y < 70 ? 2000 : 1900);
      var day = a, month = b;
      if (b > 12 && a <= 12) { day = b; month = a; } // unmistakably US order
      if (month < 1 || month > 12 || day < 1 || day > 31) return "";
      return y + "-" + pad2(month) + "-" + pad2(day);
    }

    m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
    if (m) {
      var mm = MONTHS[m[2].slice(0, 3).toLowerCase()];
      if (mm) return m[3] + "-" + pad2(mm) + "-" + pad2(+m[1]);
    }

    if (/^\d{5}$/.test(s)) {
      var days = +s;
      if (days > 20000 && days < 60000) {
        return new Date(Date.UTC(1899, 11, 30) + days * MS_DAY).toISOString().slice(0, 10);
      }
    }
    return "";
  }

  var YES = ["y", "yes", "true", "1", "done", "protected", "served", "checked", "complete", "completed"];
  var NO = ["n", "no", "false", "0", "missing", "not done", "incomplete", "not protected", "not served"];

  function parseBool(value) {
    if (value === null || value === undefined) return null;
    var v = String(value).trim().toLowerCase();
    if (!v) return null;
    if (YES.indexOf(v) !== -1) return true;
    if (NO.indexOf(v) !== -1) return false;
    return null;
  }

  // ── CSV ──────────────────────────────────────────────────────
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function parseDelimited(text) {
    var clean = String(text || "").replace(/^\uFEFF/, "");
    var firstLine = clean.split(/\r?\n/)[0] || "";
    var candidates = [",", "\t", ";", "|"];
    var delim = ",", best = -1;
    for (var c = 0; c < candidates.length; c++) {
      var n = firstLine.split(candidates[c]).length - 1;
      if (n > best) { best = n; delim = candidates[c]; }
    }

    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < clean.length; i++) {
      var ch = clean[i];
      if (inQuotes) {
        if (ch === '"') {
          if (clean[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        row.push(field); field = "";
      } else if (ch === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) {
      return r.some(function (cell) { return String(cell).trim() !== ""; });
    });
  }

  var COLUMNS = {
    address: ["address", "property", "property address", "addr", "address line 1", "address 1"],
    postcode: ["postcode", "post code", "postal code", "zip"],
    start: ["tenancy start", "tenancy start date", "tenancy commencement", "start", "start date", "commenced", "move in"],
    gas: ["gas", "gas safety", "gas safety certificate", "gas cert", "cp12", "gas saf"],
    eicr: ["eicr", "eicr date", "electrical safety", "electrical", "eicr completed"],
    epc: ["epc", "epc date", "energy performance", "energy performance certificate"],
    alarms: ["alarms", "alarm", "alarm check", "smoke alarms", "smoke alarm"],
    legionella: ["legionella", "legionella risk assessment", "lra", "water risk"],
    deposit: ["deposit", "deposit protected", "deposit registered", "deposit scheme"],
    howto: ["how to rent", "how to rent guide", "guide"],
    rtr: ["right to rent", "right to rent check", "rtr"],
    gasgiven: ["gas cert to tenant", "gas certificate to tenant", "cp12 served", "gas given"]
  };

  function matchesColumn(header, key) {
    var aliases = COLUMNS[key];
    for (var i = 0; i < aliases.length; i++) {
      if (header === aliases[i] || header.indexOf(aliases[i]) !== -1) return true;
    }
    return false;
  }

  function scoreHeader(row) {
    var score = 0;
    for (var i = 0; i < row.length; i++) {
      var h = norm(row[i]);
      if (!h) continue;
      for (var key in COLUMNS) {
        if (matchesColumn(h, key)) { score++; break; }
      }
    }
    return score;
  }

  function mapColumns(headerRow) {
    var map = {};
    // Exact aliases win over partial matches, so "Property Address" does not
    // get claimed by a later, vaguer column.
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < headerRow.length; i++) {
        var h = norm(headerRow[i]);
        if (!h) continue;
        for (var key in COLUMNS) {
          if (map[key] !== undefined) continue;
          var aliases = COLUMNS[key];
          var hit = false;
          for (var a = 0; a < aliases.length; a++) {
            if (pass === 0 ? h === aliases[a] : h.indexOf(aliases[a]) !== -1) { hit = true; break; }
          }
          if (hit) { map[key] = i; break; }
        }
      }
    }
    return map;
  }

  function analyse(text) {
    var rows = parseDelimited(text);
    var result = { rows: rows, headerIndex: -1, map: {}, properties: [], skipped: 0, total: 0 };
    if (!rows.length) return result;

    var bestScore = 0;
    for (var i = 0; i < Math.min(rows.length, 8); i++) {
      var sc = scoreHeader(rows[i]);
      if (sc > bestScore) { bestScore = sc; result.headerIndex = i; }
    }
    if (result.headerIndex === -1) return result;

    result.map = mapColumns(rows[result.headerIndex]);

    for (var r = result.headerIndex + 1; r < rows.length; r++) {
      var row = rows[r];
      result.total++;

      function cell(key) {
        var idx = result.map[key];
        if (idx === undefined) return null;
        return row[idx] === undefined ? "" : String(row[idx]).trim();
      }

      var address = cell("address") || "";
      var postcode = cell("postcode") || "";
      if (!address && !postcode) { result.skipped++; continue; }

      var full = address;
      if (postcode && address.indexOf(postcode) === -1) {
        full = address ? address + ", " + postcode : postcode;
      }

      var done = {};
      CHECKS.forEach(function (c) {
        var v = cell(c.id);
        done[c.id] = v === null ? null : parseDate(v);
      });

      var onStart = {};
      START_CHECKS.forEach(function (s) {
        var v = cell(s.id);
        onStart[s.id] = v === null ? null : (parseBool(v) === true);
      });

      result.properties.push({
        id: "p" + Date.now().toString(36) + "_" + r,
        address: full,
        start: parseDate(cell("start") || ""),
        done: done,
        onStart: onStart
      });
    }
    return result;
  }

  // ── status ───────────────────────────────────────────────────
  function statusOf(check, property) {
    var last = property.done ? property.done[check.id] : null;
    if (last === null || last === undefined) {
      return { level: "warn", text: "No data", note: "Not in the import · " + check.note };
    }
    if (!last) {
      return { level: "bad", text: "Not recorded", note: "No date on file · " + check.note };
    }
    var expiry = addMonths(last, check.months);
    if (!expiry) return { level: "bad", text: "Bad date", note: check.note };

    var days = daysFromNow(expiry);
    if (days < 0) {
      return { level: "bad", text: "Overdue " + Math.abs(days) + "d", note: "Expired " + fmt(iso(expiry)) + " · " + check.note };
    }
    if (days <= SOON_DAYS) {
      return { level: "warn", text: "Due in " + days + "d", note: fmt(iso(expiry)) + " · " + check.note };
    }
    return { level: "good", text: "Valid", note: "Expires " + fmt(iso(expiry)) };
  }

  function startStatus(property, item) {
    var v = property.onStart ? property.onStart[item.id] : null;
    if (v === null || v === undefined) {
      return { level: "warn", text: "No data", note: "Not in the import · " + item.note };
    }
    return v
      ? { level: "good", text: "Done", note: item.note }
      : { level: "bad", text: "Missing", note: item.note };
  }

  function hasIssue(p) {
    for (var i = 0; i < CHECKS.length; i++) if (statusOf(CHECKS[i], p).level === "bad") return true;
    for (var j = 0; j < START_CHECKS.length; j++) if (startStatus(p, START_CHECKS[j]).level === "bad") return true;
    return false;
  }

  // ── state ────────────────────────────────────────────────────
  function seed() {
    return [
      {
        id: "p1",
        address: "14 Palatine Road, M20 3ZA",
        start: shiftMonths(-34),
        done: { gas: shiftMonths(-13), eicr: shiftMonths(-59), epc: shiftMonths(-104), alarms: shiftMonths(-11), legionella: shiftMonths(-20) },
        onStart: { deposit: true, howto: true, rtr: true, gasgiven: true }
      },
      {
        id: "p2",
        address: "8 Chorlton Mill, M1 5BB",
        start: shiftMonths(-9),
        done: { gas: shiftMonths(-8), eicr: shiftMonths(-8), epc: shiftMonths(-30), alarms: shiftMonths(-8), legionella: shiftMonths(-8) },
        onStart: { deposit: true, howto: true, rtr: true, gasgiven: true }
      },
      {
        id: "p3",
        address: "221 Stockport Road, M12 4NS",
        start: shiftMonths(-2),
        done: { gas: shiftMonths(-1), eicr: "", epc: shiftMonths(-12), alarms: shiftMonths(-1), legionella: "" },
        onStart: { deposit: true, howto: true, rtr: false, gasgiven: false }
      }
    ];
  }

  var state = load();

  function load() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORE) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* corrupt or blocked storage: fall through */ }
    return seed();
  }

  function persist() {
    try { global.localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  function setState(next) {
    state = next;
    persist();
  }

  // ── render ───────────────────────────────────────────────────
  var openEdit = null;
  var pending = null;

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function pill(level, text) {
    return '<span class="pill pill-' + level + '">' + escapeHtml(text) + "</span>";
  }

  function visibleProperties() {
    var q = ($("search") && $("search").value ? $("search").value : "").toLowerCase().trim();
    var issuesOnly = $("only-issues") && $("only-issues").checked;
    return state.filter(function (p) {
      if (issuesOnly && !hasIssue(p)) return false;
      if (q && p.address.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function render() {
    var list = $("list");
    if (!list) return;

    var shown = visibleProperties();
    var count = $("list-count");
    if (count) {
      count.textContent = shown.length === state.length
        ? state.length + " propert" + (state.length === 1 ? "y" : "ies")
        : shown.length + " of " + state.length + " shown";
    }

    if (!shown.length) {
      list.innerHTML = '<div class="empty">' +
        (state.length ? "Nothing matches that filter." : "No properties yet. Add one above, or import a portfolio export.") +
        "</div>";
      updateStats();
      return;
    }

    list.innerHTML = shown.map(function (p) {
      var rows = CHECKS.map(function (c) {
        var s = statusOf(c, p);
        return '<div class="check"><div class="top"><span class="name">' + escapeHtml(c.label) + "</span>" +
               pill(s.level, s.text) + '</div><div class="note">' + escapeHtml(s.note) + "</div></div>";
      }).join("");

      var startRows = START_CHECKS.map(function (item) {
        var s = startStatus(p, item);
        return '<div class="check"><div class="top"><span class="name">' + escapeHtml(item.label) + "</span>" +
               pill(s.level, s.text) + '</div><div class="note">' + escapeHtml(s.note) + "</div></div>";
      }).join("");

      var editFields = CHECKS.map(function (c) {
        var val = p.done && p.done[c.id] ? p.done[c.id] : "";
        return '<label>' + escapeHtml(c.label) + '<input type="date" data-edit="' + c.id + '" value="' + val + '"></label>';
      }).join("");

      var editToggles = START_CHECKS.map(function (item) {
        var checked = p.onStart && p.onStart[item.id] === true ? " checked" : "";
        return '<label class="chk"><input type="checkbox" data-start-edit="' + item.id + '"' + checked + "> " + escapeHtml(item.label) + "</label>";
      }).join("");

      return '<div class="prop" data-id="' + p.id + '">' +
        '<div class="prop-head"><div><h3>' + escapeHtml(p.address) + "</h3>" +
        '<div class="meta">Tenancy started ' + fmt(p.start) + "</div></div>" +
        '<div class="prop-actions">' +
          '<button class="link-btn" data-edit-toggle="' + p.id + '">Edit dates</button>' +
          '<button class="link-btn" data-del="' + p.id + '">Remove</button>' +
        "</div></div>" +
        '<div class="checks">' + rows + "</div>" +
        '<div class="checks">' + startRows + "</div>" +
        '<details class="edit"' + (openEdit === p.id ? " open" : "") + ' data-panel="' + p.id + '">' +
          "<summary>Edit dates and documents</summary>" +
          '<div class="edit-grid">' + editFields + editToggles + "</div>" +
          '<p class="tiny muted" style="margin:.7rem 0 0">Changes save automatically in this browser.</p>' +
        "</details>" +
      "</div>";
    }).join("");

    updateStats();
  }

  function updateStats() {
    var over = 0, soon = 0, clear = 0;
    state.forEach(function (p) {
      CHECKS.forEach(function (c) {
        var lvl = statusOf(c, p).level;
        if (lvl === "bad") over++; else if (lvl === "warn") soon++; else clear++;
      });
      START_CHECKS.forEach(function (item) {
        var lvl = startStatus(p, item).level;
        if (lvl === "bad") over++; else if (lvl === "warn") soon++; else clear++;
      });
    });
    if ($("s-props")) $("s-props").textContent = state.length;
    if ($("s-over")) $("s-over").textContent = over;
    if ($("s-soon")) $("s-soon").textContent = soon;
    if ($("s-clear")) $("s-clear").textContent = clear;
  }

  // ── import report ────────────────────────────────────────────
  function reportHtml(a) {
    if (!a.rows.length) {
      return '<span class="err">Nothing to read — paste some rows or choose a file.</span>';
    }
    if (a.headerIndex === -1) {
      return '<span class="err">Could not find a header row with recognisable column names. ' +
             "Include at least a column called “Property” or “Address”.</span>";
    }

    var found = Object.keys(a.map);
    var missing = Object.keys(COLUMNS).filter(function (k) { return a.map[k] === undefined; });
    var sample = a.properties.slice(0, 4).map(function (p) {
      return "<tr><td>" + escapeHtml(p.address) + "</td><td>" + (p.start ? fmt(p.start) : "—") +
             "</td><td>" + (p.done.gas ? fmt(p.done.gas) : "—") + "</td></tr>";
    }).join("");

    var html = "<p><b>" + a.properties.length + "</b> propert" + (a.properties.length === 1 ? "y" : "ies") +
      " ready to import";
    if (a.skipped) html += " · " + a.skipped + " row(s) skipped (no address)";
    html += "</p>";

    html += '<p class="tiny">Columns matched: ' +
      (found.length ? found.map(function (k) { return "<code>" + k + "</code>"; }).join(" ") : "<em>none</em>") + "</p>";

    if (missing.length) {
      html += '<p class="tiny">Not in this file: ' + missing.join(", ") +
        " — those show as “No data” rather than missing, so you are not accused of something the export never had.</p>";
    }

    if (sample) {
      html += '<table class="preview"><thead><tr><th>Address</th><th>Tenancy start</th><th>Gas</th></tr></thead><tbody>' +
        sample + "</tbody></table>";
    }
    return html;
  }

  function analyseCurrentSource() {
    var fileInput = $("file");
    var finish = function (text) {
      pending = analyse(text);
      var report = $("import-report");
      if (report) report.innerHTML = reportHtml(pending);
      if ($("import-btn")) $("import-btn").disabled = !pending.properties.length;
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      var reader = new FileReader();
      reader.onload = function () { finish(String(reader.result || "")); };
      reader.onerror = function () {
        if ($("import-report")) $("import-report").innerHTML = '<span class="err">Could not read that file.</span>';
      };
      reader.readAsText(fileInput.files[0]);
      return;
    }
    finish($("paste") ? $("paste").value : "");
  }

  function downloadCsv() {
    var rows = [["property", "tenancy start", "check", "status", "detail"]];
    state.forEach(function (p) {
      CHECKS.forEach(function (c) {
        var s = statusOf(c, p);
        rows.push([p.address, p.start || "", c.label, s.text, s.note]);
      });
      START_CHECKS.forEach(function (item) {
        var s = startStatus(p, item);
        rows.push([p.address, p.start || "", item.label, s.text, s.note]);
      });
    });
    var csv = rows.map(function (r) {
      return r.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "compliance-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── events ───────────────────────────────────────────────────
  function wire() {
    var addForm = $("add-form");
    if (addForm) {
      addForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var address = $("addr").value.trim();
        if (!address) return;
        var postcode = $("pcode") ? $("pcode").value.trim() : "";
        if (postcode && address.indexOf(postcode) === -1) address += ", " + postcode;

        setState(state.concat([{
          id: "p" + Date.now().toString(36),
          address: address,
          start: $("start").value || "",
          done: {
            gas: $("gas").value || "", eicr: "", epc: "",
            alarms: "", legionella: ""
          },
          onStart: { deposit: false, howto: false, rtr: false, gasgiven: false }
        }]));
        addForm.reset();
        render();
      });
    }

    var list = $("list");
    if (list) {
      list.addEventListener("click", function (e) {
        var t = e.target;
        if (t.hasAttribute && t.hasAttribute("data-del")) {
          setState(state.filter(function (p) { return p.id !== t.getAttribute("data-del"); }));
          render();
          return;
        }
        if (t.hasAttribute && t.hasAttribute("data-edit-toggle")) {
          var id = t.getAttribute("data-edit-toggle");
          openEdit = openEdit === id ? null : id;
          render();
        }
      });

      list.addEventListener("change", function (e) {
        var t = e.target;
        var card = t.closest ? t.closest(".prop") : null;
        if (!card) return;
        var id = card.getAttribute("data-id");
        var prop = null;
        for (var i = 0; i < state.length; i++) if (state[i].id === id) prop = state[i];
        if (!prop) return;

        if (t.hasAttribute("data-edit")) {
          prop.done[t.getAttribute("data-edit")] = t.value || "";
        } else if (t.hasAttribute("data-start-edit")) {
          prop.onStart[t.getAttribute("data-start-edit")] = t.checked;
        } else {
          return;
        }
        openEdit = id;
        persist();
        render();
      });
    }

    if ($("preview-btn")) $("preview-btn").addEventListener("click", analyseCurrentSource);

    if ($("import-btn")) {
      $("import-btn").addEventListener("click", function () {
        if (!pending || !pending.properties.length) return;
        var replace = $("replace") && $("replace").checked;
        setState(replace ? pending.properties : state.concat(pending.properties));
        var n = pending.properties.length;
        setState(state);
        openEdit = null;
        pending = null;
        $("import-btn").disabled = true;
        if ($("import-report")) {
          $("import-report").innerHTML = "<p><b>Imported " + n + " propert" + (n === 1 ? "y" : "ies") +
            ".</b> Scroll down to see them.</p>";
        }
        if ($("paste")) $("paste").value = "";
        render();
      });
    }

    if ($("export")) $("export").addEventListener("click", downloadCsv);
    if ($("print")) $("print").addEventListener("click", function () { global.print(); });

    if ($("reset")) {
      $("reset").addEventListener("click", function () {
        setState(seed());
        render();
      });
    }

    if ($("search")) $("search").addEventListener("input", render);
    if ($("only-issues")) $("only-issues").addEventListener("change", render);
  }

  if (typeof document !== "undefined" && document.getElementById) wire();
  render();
  persist();

  global.TRACKER = {
    analyse: analyse,
    parseDelimited: parseDelimited,
    parseDate: parseDate,
    parseBool: parseBool,
    mapColumns: mapColumns,
    statusOf: statusOf,
    startStatus: startStatus,
    CHECKS: CHECKS,
    START_CHECKS: START_CHECKS,
    getState: function () { return state; },
    setState: setState,
    render: render,
    seed: seed
  };
})(typeof window !== "undefined" ? window : globalThis);
