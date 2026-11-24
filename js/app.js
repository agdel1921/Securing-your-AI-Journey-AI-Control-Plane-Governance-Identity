/* Executive demo logic. Static, no network calls, all data simulated (see data.js). */
(function () {
  "use strict";

  var D = window.DEMO;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* ---------- shared state ---------- */
  var state = {
    scene: 0,
    scanned: false,
    scanTimer: null,
    discFilter: "All",
    selectedAgent: D.agents[0].id,
    brought: {},            // agent id -> true once "brought under governance"
    pol: { scenario: "s2", autonomy: 2, region: "APAC", registered: true },
    cp: { timer: null, feed: [], paused: {}, filter: "All", idx: 0,
          counts: { total: 12480, allowed: 12310, approval: 148, blocked: 22 } },
    grc: { r: -1, c: -1 },
    roi: { cases: 25, value: 0.4, speed: 30, incidents: 3, cost: 1.5, audit: 0.8, program: 3.5 }
  };

  function view(a) {
    if (!state.brought[a.id]) return a;
    var c = {}; for (var k in a) c[k] = a[k];
    c.status = "Governed";
    c.origin = "In-house";
    c.owner = "Assigned: Regional Operations Lead";
    c.risk = Math.max(30, a.risk - 35);
    return c;
  }
  function tier(n) { return D.autonomyTiers[n]; }
  function statusBadge(s) {
    var cls = s === "Governed" ? "ok" : s === "Review" ? "warn" : "bad";
    return '<span class="badge ' + cls + '">' + esc(s) + "</span>";
  }
  function riskBar(r) {
    var col = r >= 70 ? "var(--bad)" : r >= 50 ? "var(--warn)" : "var(--ok)";
    return '<span class="bar"><i style="width:' + r + "%;background:" + col + '"></i></span>' + r;
  }
  function fmtTime(d) {
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  /* ---------- navigation ---------- */
  var scenes = $$(".scene");
  var nav = $("#nav");
  scenes.forEach(function (s, i) {
    var b = el("button", "", esc(s.getAttribute("data-title")));
    b.addEventListener("click", function () { go(i); });
    nav.appendChild(b);
  });

  function go(i) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    state.scene = i;
    scenes.forEach(function (s, n) { s.classList.toggle("active", n === i); });
    $$("button", nav).forEach(function (b, n) { b.classList.toggle("active", n === i); });
    $("#progress-bar").style.width = ((i + 1) / scenes.length * 100) + "%";
    $("#counter").textContent = (i + 1) + " / " + scenes.length;
    $("#btn-prev").disabled = i === 0;
    $("#btn-next").disabled = i === scenes.length - 1;
    $("#notes-body").textContent = D.notes[i] || "";
    if (history.replaceState) history.replaceState(null, "", "#" + (i + 1));
    if (i === 6) startCP(); else stopCP();
    window.scrollTo(0, 0);
  }

  $("#btn-prev").addEventListener("click", function () { go(state.scene - 1); });
  $("#btn-next").addEventListener("click", function () { go(state.scene + 1); });
  $$("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () { go(parseInt(b.getAttribute("data-go"), 10)); });
  });
  $("#btn-notes").addEventListener("click", function () { $("#notes").classList.toggle("hidden"); });
  $("#notes-close").addEventListener("click", function () { $("#notes").classList.add("hidden"); });
  $("#btn-full").addEventListener("click", toggleFull);
  function toggleFull() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) { document.exitFullscreen(); }
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "SELECT" || t === "TEXTAREA") return;
    if (e.key === "ArrowRight" || e.key === "PageDown") go(state.scene + 1);
    else if (e.key === "ArrowLeft" || e.key === "PageUp") go(state.scene - 1);
    else if (e.key === "n" || e.key === "N") $("#notes").classList.toggle("hidden");
    else if (e.key === "f" || e.key === "F") toggleFull();
  });

  /* ---------- 3. discovery ---------- */
  var discFilters = ["All", "Unmanaged", "Vendor-embedded", "High data sensitivity"];
  function renderDiscFilters() {
    var box = $("#disc-filters"); box.innerHTML = "";
    discFilters.forEach(function (f) {
      var b = el("button", "chip" + (state.discFilter === f ? " on" : ""), esc(f));
      b.addEventListener("click", function () { state.discFilter = f; renderDiscFilters(); renderDisc(); });
      box.appendChild(b);
    });
  }
  function discMatch(a) {
    switch (state.discFilter) {
      case "Unmanaged": return a.status === "Unmanaged";
      case "Vendor-embedded": return a.origin === "Vendor-embedded";
      case "High data sensitivity": return a.data === "High";
      default: return true;
    }
  }
  function renderDiscKpis(shown) {
    var all = D.agents.map(view);
    var vals = state.scanned || shown ? all.slice(0, shown == null ? all.length : shown) : [];
    var n = function (fn) { return vals.filter(fn).length; };
    var k = [
      ["Agents found", vals.length, ""],
      ["No named owner", n(function (a) { return a.owner === "Not assigned"; }), "bad"],
      ["Vendor-embedded", n(function (a) { return a.origin === "Vendor-embedded"; }), "warn"],
      ["Handle high-sensitivity data", n(function (a) { return a.data === "High"; }), "warn"],
      ["Fully governed", n(function (a) { return a.status === "Governed"; }), "ok"]
    ];
    $("#disc-summary").innerHTML = k.map(function (x) {
      return '<div class="kpi ' + x[2] + '"><b>' + (vals.length || state.scanned ? x[1] : "-") + "</b><span>" + x[0] + "</span></div>";
    }).join("");
  }
  function renderDisc(animateTo) {
    var body = $("#disc-body");
    var all = D.agents.map(view);
    var limit = animateTo == null ? (state.scanned ? all.length : 0) : animateTo;
    var rows = all.slice(0, limit).filter(discMatch);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8" class="muted">' +
        (state.scanned || limit ? "No agents match this filter." : "No scan has been run yet. Select &lsquo;Run discovery scan&rsquo;.") + "</td></tr>";
    } else {
      body.innerHTML = rows.map(function (a, i) {
        var last = animateTo != null && a === all[limit - 1];
        return '<tr class="' + (a.status === "Unmanaged" ? "unmanaged " : "") + (last ? "reveal" : "") + '">' +
          "<td><strong>" + esc(a.name) + "</strong><br><small class=\"muted\">" + esc(a.id) + " &middot; " + esc(a.domain) + "</small></td>" +
          "<td>" + esc(a.region) + "</td><td>" + esc(a.origin) + "</td>" +
          "<td>" + esc(tier(a.autonomy).name) + "</td><td>" + esc(a.data) + "</td>" +
          "<td>" + esc(a.owner) + "</td><td>" + riskBar(a.risk) + "</td><td>" + statusBadge(a.status) + "</td></tr>";
      }).join("");
    }
    renderDiscKpis(animateTo);
    var ins = $("#disc-insight");
    if (state.scanned) {
      var un = all.filter(function (a) { return a.owner === "Not assigned"; }).length;
      var ve = all.filter(function (a) { return a.origin === "Vendor-embedded"; }).length;
      ins.classList.remove("hidden");
      ins.textContent = un
        ? un + " of " + all.length + " agents have no accountable owner, and " + ve +
          " are AI features embedded in vendor software that nobody explicitly deployed. These are the first things to bring under governance."
        : "Every discovered agent now has an owner and an identity.";
    } else { ins.classList.add("hidden"); }
  }
  $("#btn-scan").addEventListener("click", function () {
    if (state.scanTimer) return;
    state.scanned = false;
    var n = 0, total = D.agents.length;
    var status = $("#scan-status");
    state.scanTimer = setInterval(function () {
      n++;
      status.textContent = "Scanning terminals, cloud services and vendor tools... " + n + " found";
      renderDisc(n);
      if (n >= total) {
        clearInterval(state.scanTimer); state.scanTimer = null;
        state.scanned = true; status.textContent = "Scan complete (simulated).";
        renderDisc();
      }
    }, 220);
  });

  /* ---------- 4. identity ---------- */
  function renderIdList() {
    var box = $("#id-list"); box.innerHTML = "";
    D.agents.forEach(function (raw) {
      var a = view(raw);
      var b = el("button", "id-item" + (a.id === state.selectedAgent ? " on" : ""),
        "<strong>" + esc(a.name) + "</strong><small>" + esc(a.id) + " &middot; " + esc(a.region) + " &middot; " + esc(a.status) + "</small>");
      b.addEventListener("click", function () { state.selectedAgent = a.id; renderIdList(); renderIdCard(); });
      box.appendChild(b);
    });
  }
  function lvlBar(n) {
    var h = '<span class="lvl">';
    for (var i = 1; i <= 3; i++) h += '<i class="' + (i <= n ? "f" : "") + '"></i>';
    return h + "</span>";
  }
  function renderIdCard() {
    var raw = D.agents.filter(function (a) { return a.id === state.selectedAgent; })[0];
    var a = view(raw);
    var unmanaged = a.status === "Unmanaged";
    var cred = unmanaged ? "Shared login detected" : "Own identity. Short-lived, rotated automatically";
    var rows = D.systems.map(function (s, i) {
      var lv = unmanaged && !state.brought[a.id] ? a.scopes[i] : (a.scopes[i] > 0 ? Math.min(a.scopes[i], tier(a.autonomy).level >= 3 ? 3 : 2) : 0);
      return "<tr><td>" + esc(s) + "</td><td>" + lvlBar(lv) + esc(D.scopeLabels[lv]) + "</td></tr>";
    }).join("");
    var h = '<div class="id-head"><div><h3>' + esc(a.name) + '</h3><span class="muted">' + esc(a.id) + " &middot; " + esc(a.domain) + "</span></div>" + statusBadge(a.status) + "</div>" +
      '<div class="id-meta">' +
      "<div><b>Accountable owner</b>" + esc(a.owner) + "</div>" +
      "<div><b>Credential</b>" + esc(cred) + "</div>" +
      "<div><b>Autonomy tier</b>" + esc(tier(a.autonomy).name) + "</div>" +
      "<div><b>Purpose</b>" + esc(a.domain) + " support, " + esc(D.regions[a.region]) + "</div></div>" +
      '<p class="muted small">' + esc(tier(a.autonomy).desc) + "</p>" +
      "<h3>Access it holds today</h3><table class=\"scopes\">" + rows + "</table>";
    if (unmanaged) {
      h += '<div class="elev"><strong>This agent is not under governance.</strong><p class="small muted">It has no owner and borrows a shared login. Bringing it under governance gives it an identity, a named owner and reduced access.</p>' +
        '<button class="primary" id="btn-bring">Bring under governance</button></div>';
    } else {
      h += '<div class="elev"><strong>Need more access for a task?</strong><p class="small muted">Elevated access is requested, approved by the owner, time-limited and logged.</p>' +
        '<button class="primary" id="btn-elev">Request elevated access (2 hours)</button><div id="elev-log" class="elev-log"></div></div>';
    }
    $("#id-card").innerHTML = h;
    var bb = $("#btn-bring");
    if (bb) bb.addEventListener("click", function () { state.brought[a.id] = true; renderIdList(); renderIdCard(); renderDisc(); });
    var be = $("#btn-elev");
    if (be) be.addEventListener("click", function () {
      var log = $("#elev-log"), t = new Date(), exp = new Date(t.getTime() + 2 * 3600 * 1000);
      var steps = [
        fmtTime(t) + " Request sent to " + a.owner,
        fmtTime(new Date(t.getTime() + 40000)) + " Approved by owner, reason recorded",
        fmtTime(new Date(t.getTime() + 41000)) + " Access granted until " + fmtTime(exp) + ", then removed automatically"
      ];
      log.innerHTML = ""; be.disabled = true;
      steps.forEach(function (s, i) {
        setTimeout(function () { log.appendChild(el("div", "", "&bull; " + esc(s))); if (i === steps.length - 1) be.disabled = false; }, 500 * (i + 1));
      });
    });
  }

  /* ---------- 5. policy simulator ---------- */
  function renderPolControls() {
    var p = state.pol, box = $("#pol-controls");
    var opts = D.scenarios.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === p.scenario ? " selected" : "") + ">" + esc(s.title) + "</option>";
    }).join("");
    box.innerHTML =
      '<div class="field"><label for="pol-sc">What is the agent asked to do?</label><select id="pol-sc">' + opts + "</select>" +
      '<div class="hint" id="pol-note"></div></div>' +
      '<div class="field"><span class="lab">Autonomy level granted to this agent</span><div class="seg" id="pol-aut"></div><div class="hint" id="pol-aut-d"></div></div>' +
      '<div class="field"><span class="lab">Where does it run?</span><div class="seg" id="pol-reg"></div></div>' +
      '<div class="field"><span class="lab">Is the agent registered with an identity and owner?</span><div class="seg" id="pol-id"></div></div>';
    $("#pol-sc").addEventListener("change", function (e) { p.scenario = e.target.value; renderPol(); });
    renderPol();
  }
  function seg(id, items, current, cb) {
    var box = $(id); box.innerHTML = "";
    items.forEach(function (it) {
      var b = el("button", current === it.v ? "on" : "", esc(it.t));
      b.addEventListener("click", function () { cb(it.v); renderPol(); });
      box.appendChild(b);
    });
  }
  function renderPol() {
    var p = state.pol;
    var sc = D.scenarios.filter(function (s) { return s.id === p.scenario; })[0];
    $("#pol-note").textContent = sc.note;
    seg("#pol-aut", D.autonomyTiers.map(function (t) { return { v: t.level, t: t.level + " " + t.name }; }), p.autonomy, function (v) { p.autonomy = v; });
    $("#pol-aut-d").textContent = tier(p.autonomy).desc;
    seg("#pol-reg", [{ v: "APAC", t: "Asia Pacific" }, { v: "EU", t: "Europe" }, { v: "MEA", t: "Middle East & Africa" }, { v: "AMER", t: "Americas" }], p.region, function (v) { p.region = v; });
    seg("#pol-id", [{ v: true, t: "Registered" }, { v: false, t: "Not registered" }], p.registered, function (v) { p.registered = v; });

    var checks = [], verdict = null, title = "", why = "";
    var add = function (st, t) { checks.push({ st: st, t: t }); };
    var set = function (v, ti, w) { if (!verdict) { verdict = v; title = ti; why = w; } };

    if (p.registered) add("ok", "Agent has its own identity and a named owner.");
    else { add("bad", "Agent is not registered, so it has no identity or owner."); set("bad", "Blocked", "Unregistered agents get no access to any system."); }

    if (sc.impact === "critical") {
      add("bad", "Safety-critical action. Company rule: never delegated to an agent.");
      set("bad", "Blocked, human only", "Safety-critical actions stay with qualified people. The agent may only alert the duty manager.");
    } else add("ok", "Not a safety-critical action.");

    if (sc.personalData) {
      if (p.region === "EU") { add("bad", "Personal data would leave the organisation. EU data-residency rule applies."); set("bad", "Blocked", "Personal data cannot be shared with an external party from this region."); }
      else { add("warn", "Personal data would leave the organisation. Privacy review required."); set("warn", "Needs approval", "The data protection officer must approve before anything is shared."); }
    } else add("ok", "No personal data involved.");

    if (sc.info) {
      add("ok", "Information only. No change is made to operations.");
      set("ok", "Allowed", "Reading and summarising within the agent's access is permitted at every autonomy level.");
    } else {
      if (p.autonomy === 0) { add("bad", "Autonomy level 'Observe' cannot take actions."); set("bad", "Blocked", "This agent is set to observe only."); }
      else if (p.autonomy === 1) { add("warn", "Autonomy level 'Recommend'. A person must carry out the action."); set("warn", "Recommendation only", "The agent proposes the action. A person executes it."); }
      else if (p.autonomy === 2) { add("warn", "Autonomy level 'Act with approval'. A named person must approve."); set("warn", "Needs approval", "The action is prepared and sent to the accountable owner for approval."); }
      else if (sc.impact === "high") { add("warn", "High-impact action. Approval is required even at higher autonomy."); set("warn", "Needs approval", "High-impact actions always involve a named person, whatever the autonomy level."); }
      else { add("ok", "Medium-impact action within the agent's pre-agreed limits."); set("ok", "Allowed within limits", "The agent acts alone inside its limits. Everything is logged and reversible."); }
    }
    add("ok", "Decision, reason and approver will be recorded for audit.");

    var cls = verdict === "ok" ? "ok" : verdict === "warn" ? "warn" : "bad";
    var mk = { ok: "&#10003;", warn: "!", bad: "&times;" };
    var rec = "decision: " + title + " | agent: " + (p.registered ? "AG-xxx" : "unknown") + " | region: " + p.region +
      " | autonomy: " + tier(p.autonomy).name + " | time: " + fmtTime(new Date());
    $("#pol-result").innerHTML =
      '<div class="verdict ' + cls + '"><div><h3>' + esc(title) + "</h3><p>" + esc(why) + "</p></div></div>" +
      '<h3 class="small">Why this outcome</h3><ul class="checks">' +
      checks.map(function (c) { return '<li><span class="mk ' + c.st + '">' + mk[c.st] + "</span><span>" + esc(c.t) + "</span></li>"; }).join("") +
      '</ul><div class="small muted">Audit record (simulated)</div><div class="rec">' + esc(rec) + "</div>";
  }

  /* ---------- 6. control plane ---------- */
  var cpAgents = [];
  D.events.forEach(function (e) { if (cpAgents.indexOf(e.agent) < 0) cpAgents.push(e.agent); });

  function renderCpFilters() {
    var box = $("#cp-filters"); box.innerHTML = "";
    ["All", "APAC", "EU", "MEA", "AMER", "Global"].forEach(function (f) {
      var b = el("button", "chip" + (state.cp.filter === f ? " on" : ""), esc(f));
      b.addEventListener("click", function () { state.cp.filter = f; renderCpFilters(); renderCpFeed(); });
      box.appendChild(b);
    });
  }
  function renderCpKpis() {
    var c = state.cp.counts, paused = Object.keys(state.cp.paused).length;
    var k = [
      ["Agents under control", D.agents.filter(function (a) { return view(a).status !== "Unmanaged"; }).length - paused, "ok"],
      ["Actions in last 24h", c.total.toLocaleString("en-US"), ""],
      ["Within limits", c.allowed.toLocaleString("en-US"), "ok"],
      ["Sent for approval", c.approval.toLocaleString("en-US"), "warn"],
      ["Blocked by policy", c.blocked.toLocaleString("en-US"), "bad"]
    ];
    $("#cp-kpis").innerHTML = k.map(function (x) { return '<div class="kpi ' + x[2] + '"><b>' + x[1] + "</b><span>" + x[0] + "</span></div>"; }).join("");
  }
  function renderCpFeed() {
    var f = state.cp.filter;
    var items = state.cp.feed.filter(function (e) { return f === "All" || e.region === f; });
    $("#cp-feed").innerHTML = items.slice(0, 40).map(function (e) {
      var cls = e.decision === "Allowed" ? "ok" : e.decision === "Blocked" ? "bad" : "warn";
      return "<li><time>" + fmtTime(e.time) + "</time><div><strong>" + esc(e.agent) + "</strong> <span class=\"muted\">(" + esc(e.region) + ")</span>" +
        "<small>" + esc(e.text) + " &middot; " + esc(e.policy) + '</small></div><span class="badge ' + cls + '">' + esc(e.decision) + "</span></li>";
    }).join("") || '<li><span class="muted">Waiting for activity...</span></li>';
  }
  function renderCpAgents() {
    var ul = $("#cp-agents"); ul.innerHTML = "";
    cpAgents.forEach(function (name) {
      var p = !!state.cp.paused[name];
      var li = el("li", p ? "paused" : "", "<span>" + esc(name) + (p ? ' <span class="badge warn">Paused</span>' : "") + "</span>");
      var b = el("button", "", p ? "Resume" : "Pause");
      b.addEventListener("click", function () {
        if (p) delete state.cp.paused[name]; else state.cp.paused[name] = true;
        renderCpAgents(); renderCpKpis(); renderBanner(name, !p);
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function renderBanner(name, paused) {
    var b = $("#cp-banner");
    if (paused) {
      b.classList.remove("hidden");
      b.textContent = name + " paused by an operator. Its requests are held, the owner is notified, and the documented manual procedure is now active so operations continue.";
    } else if (!Object.keys(state.cp.paused).length) b.classList.add("hidden");
    else b.textContent = name + " resumed. Remaining paused agents stay held.";
  }
  function tick() {
    var cp = state.cp, base = D.events[cp.idx % D.events.length]; cp.idx++;
    var e = { agent: base.agent, region: base.region, text: base.text, decision: base.decision, policy: base.policy, time: new Date() };
    if (cp.paused[e.agent]) { e.decision = "Held"; e.text = "Request received while agent is paused"; e.policy = "Manual procedure active"; }
    else {
      cp.counts.total++;
      if (e.decision === "Allowed") cp.counts.allowed++;
      else if (e.decision === "Approval") cp.counts.approval++;
      else cp.counts.blocked++;
    }
    cp.feed.unshift(e);
    if (cp.feed.length > 60) cp.feed.pop();
    renderCpFeed(); renderCpKpis();
  }
  function startCP() {
    if (state.cp.timer) return;
    renderCpFilters(); renderCpAgents(); renderCpKpis(); renderCpFeed();
    if (!state.cp.feed.length) for (var i = 0; i < 4; i++) tick();
    state.cp.timer = setInterval(tick, 2600);
  }
  function stopCP() { if (state.cp.timer) { clearInterval(state.cp.timer); state.cp.timer = null; } }

  /* ---------- 7. GRC ---------- */
  var stLabel = { aligned: "Aligned", progress: "In progress", gap: "Gap to close first" };
  function renderGrc() {
    var g = $("#grc-grid"); g.innerHTML = "";
    g.appendChild(el("div", "grc-h", ""));
    D.grcColumns.forEach(function (c) { g.appendChild(el("div", "grc-h", esc(c))); });
    D.grc.forEach(function (row, r) {
      g.appendChild(el("div", "grc-r", esc(row.region)));
      row.cells.forEach(function (cell, c) {
        var b = el("button", "grc-c " + cell.s + (state.grc.r === r && state.grc.c === c ? " on" : ""), esc(cell.t));
        b.setAttribute("aria-label", row.region + ", " + D.grcColumns[c] + ": " + stLabel[cell.s]);
        b.addEventListener("click", function () { state.grc = { r: r, c: c }; renderGrc(); });
        g.appendChild(b);
      });
    });
    var d = $("#grc-detail"), s = state.grc;
    if (s.r < 0) {
      d.innerHTML = "<h3>Select a cell</h3><p class=\"muted\">Each cell shows how one obligation area is handled in one region, using the same global control framework.</p>" +
        "<p class=\"muted\">Red cells mark where unmanaged agents or missing controls make that region the first priority.</p>";
    } else {
      var row = D.grc[s.r], cell = row.cells[s.c];
      d.innerHTML = "<h3>" + esc(cell.t) + '</h3><p class="muted small">' + esc(row.region) + " &middot; " + esc(D.grcColumns[s.c]) + "</p>" +
        '<p><span class="badge ' + (cell.s === "aligned" ? "ok" : cell.s === "gap" ? "bad" : "warn") + '">' + stLabel[cell.s] + "</span></p><p>" + esc(cell.d) + "</p>" +
        '<p class="muted small">Evidence for this area is produced automatically from agent activity records.</p>';
    }
  }

  /* ---------- 8. value model ---------- */
  var roiDefs = [
    { k: "cases", l: "AI use cases planned across the network", min: 5, max: 60, step: 1, f: function (v) { return v; } },
    { k: "value", l: "Average annual value per use case (USD m)", min: 0.1, max: 1.5, step: 0.1, f: function (v) { return v.toFixed(1); } },
    { k: "speed", l: "Faster time to production with governance", min: 10, max: 60, step: 5, f: function (v) { return v + "%"; } },
    { k: "incidents", l: "Serious AI-related incidents avoided per year", min: 0, max: 10, step: 1, f: function (v) { return v; } },
    { k: "cost", l: "Average cost of one serious incident (USD m)", min: 0.2, max: 5, step: 0.1, f: function (v) { return v.toFixed(1); } },
    { k: "audit", l: "Audit and compliance effort saved (USD m)", min: 0, max: 3, step: 0.1, f: function (v) { return v.toFixed(1); } },
    { k: "program", l: "Annual cost of the governance programme (USD m)", min: 1, max: 10, step: 0.5, f: function (v) { return v.toFixed(1); } }
  ];
  function renderRoiInputs() {
    var box = $("#roi-inputs"); box.innerHTML = "";
    roiDefs.forEach(function (d) {
      var w = el("div", "slider");
      w.innerHTML = '<label for="roi-' + d.k + '"><span>' + esc(d.l) + '</span><span id="roi-v-' + d.k + '">' + d.f(state.roi[d.k]) + "</span></label>" +
        '<input type="range" id="roi-' + d.k + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + state.roi[d.k] + '">';
      box.appendChild(w);
      $("#roi-" + d.k, w).addEventListener("input", function (e) {
        state.roi[d.k] = parseFloat(e.target.value);
        $("#roi-v-" + d.k).textContent = d.f(state.roi[d.k]);
        renderRoiOut();
      });
    });
    renderRoiOut();
  }
  function renderRoiOut() {
    var r = state.roi;
    var faster = r.cases * r.value * (r.speed / 100);
    var risk = r.incidents * r.cost;
    var audit = r.audit;
    var total = faster + risk + audit;
    var net = total - r.program;
    var roi = r.program ? Math.round(net / r.program * 100) : 0;
    var payback = total > 0 ? Math.min(99, r.program / total * 12) : 99;
    var f1 = function (n) { return n.toFixed(1); };
    var pct = function (n) { return total > 0 ? (n / total * 100).toFixed(1) : 0; };
    $("#roi-output").innerHTML =
      '<div class="stack"><i style="width:' + pct(faster) + '%;background:var(--accent)"></i><i style="width:' + pct(risk) + '%;background:var(--accent2)"></i><i style="width:' + pct(audit) + '%;background:var(--hot)"></i></div>' +
      '<div class="roi-row"><span><span class="dot" style="background:var(--accent)"></span>Value from faster scale-up</span><b>' + f1(faster) + "</b></div>" +
      '<div class="roi-row"><span><span class="dot" style="background:var(--accent2)"></span>Avoided incident cost</span><b>' + f1(risk) + "</b></div>" +
      '<div class="roi-row"><span><span class="dot" style="background:var(--hot)"></span>Audit effort saved</span><b>' + f1(audit) + "</b></div>" +
      '<div class="roi-row"><span>Total benefit</span><b>' + f1(total) + "</b></div>" +
      '<div class="roi-row"><span>Programme cost</span><b>-' + f1(r.program) + "</b></div>" +
      '<div class="roi-row total"><span>Net annual effect</span><b>' + (net >= 0 ? "" : "-") + Math.abs(net).toFixed(1) + "</b></div>" +
      '<div class="roi-row"><span>Return on investment</span><b>' + roi + "%</b></div>" +
      '<div class="roi-row"><span>Payback</span><b>' + (payback >= 99 ? "n/a" : payback.toFixed(1) + " months") + "</b></div>" +
      '<p class="roi-note">Illustrative arithmetic on placeholder inputs, not a forecast. Faster scale-up = use cases x value x time saved. To be replaced with the Port Authority&#39;s own baselines.</p>';
  }

  /* ---------- 9. roadmap ---------- */
  function renderRoadmap() {
    $("#roadmap").innerHTML = D.roadmap.map(function (h) {
      return '<article class="rm"><span class="when">' + esc(h.when) + "</span><h3>" + esc(h.name) + "</h3><ul>" +
        h.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
        '</ul><div class="out">Outcome: ' + esc(h.outcome) + "</div></article>";
    }).join("");
  }

  /* ---------- init ---------- */
  renderDiscFilters(); renderDisc();
  renderIdList(); renderIdCard();
  renderPolControls();
  renderGrc();
  renderRoiInputs();
  renderRoadmap();
  var start = parseInt((location.hash || "").replace("#", ""), 10);
  go(isNaN(start) ? 0 : start - 1);
})();
