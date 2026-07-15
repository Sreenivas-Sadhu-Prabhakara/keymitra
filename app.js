/* ============================================================
   keymitra — phonetic keyboard + transliterator for Indian scripts.
   No network. No dependencies. Last text kept in localStorage only.

   The transliteration engine is a longest-match ITRANS-style tokeniser
   and syllable composer. It is verified against exact Unicode for
   Devanagari and Kannada (see README). Tamil and Telugu are beta.
   ============================================================ */
(function () {
  "use strict";

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var DATA = window.KEYMITRA_DATA;

  /* ============================================================
     ENGINE — token table (built once per script, cached)
     ============================================================ */
  var tokenCache = {};

  function buildTokens(script) {
    if (tokenCache[script.id]) return tokenCache[script.id];
    var toks = [];
    Object.keys(script.vowels).forEach(function (k) {
      toks.push({ key: k, type: "vowel", data: script.vowels[k] });
    });
    Object.keys(script.vowelAliases || {}).forEach(function (k) {
      var target = script.vowelAliases[k];
      if (script.vowels[target]) toks.push({ key: k, type: "vowel", data: script.vowels[target] });
    });
    Object.keys(script.consonants).forEach(function (k) {
      toks.push({ key: k, type: "cons", data: script.consonants[k] });
    });
    Object.keys(script.specials).forEach(function (k) {
      toks.push({ key: k, type: "special", data: script.specials[k] });
    });
    Object.keys(script.halant || {}).forEach(function (k) {
      toks.push({ key: k, type: "halant", data: script.halant[k] });
    });
    Object.keys(script.digits).forEach(function (k) {
      toks.push({ key: k, type: "digit", data: script.digits[k] });
    });
    // longest Latin key first so greedy matching prefers digraphs (kh, aa…)
    toks.sort(function (a, b) { return b.key.length - a.key.length; });
    tokenCache[script.id] = toks;
    return toks;
  }

  function matchAt(tokens, input, pos) {
    for (var i = 0; i < tokens.length; i++) {
      if (input.startsWith(tokens[i].key, pos)) return tokens[i];
    }
    return null;
  }

  // Latin -> script. See README for the schwa convention:
  //  - a consonant carries an inherent short 'a';
  //  - a virama is inserted only between a consonant and a FOLLOWING
  //    consonant (a cluster);
  //  - at a word boundary (space, digit, punctuation, end) the trailing
  //    consonant keeps its inherent 'a' (bhaarat -> भारत);
  //  - an explicit halant ".h" (or "q") forces a bare consonant.
  function transliterate(input, script) {
    var tokens = buildTokens(script);
    var out = "";
    var pos = 0;
    var pendingCons = false;

    while (pos < input.length) {
      var tok = matchAt(tokens, input, pos);
      if (!tok) {
        pendingCons = false;            // boundary: keep inherent 'a'
        out += input[pos];
        pos += 1;
        continue;
      }
      if (tok.type === "cons") {
        if (pendingCons) out += script.virama;   // cluster
        out += tok.data;
        pendingCons = true;
      } else if (tok.type === "vowel") {
        if (pendingCons) { out += tok.data[1]; pendingCons = false; }  // matra
        else { out += tok.data[0]; }                                   // independent
      } else if (tok.type === "halant") {
        if (pendingCons) { out += tok.data; pendingCons = false; }
      } else if (tok.type === "special") {
        pendingCons = false;
        out += tok.data;
      } else if (tok.type === "digit") {
        pendingCons = false;
        out += tok.data;
      }
      pos += tok.key.length;
    }
    return out;
  }

  /* ============================================================
     STATE + PERSISTENCE (localStorage only)
     ============================================================ */
  var STORE_KEY = "keymitra:v1";
  var storageOk = true;
  var state = { scriptId: "devanagari", text: "" };

  function save() {
    if (!storageOk) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { storageOk = false; }
  }
  function load() {
    try {
      localStorage.setItem("keymitra:test", "1");
      localStorage.removeItem("keymitra:test");
    } catch (e) { storageOk = false; }
    if (!storageOk) return;
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    try {
      var loaded = JSON.parse(raw);
      if (loaded && typeof loaded === "object") {
        if (typeof loaded.scriptId === "string" && scriptById(loaded.scriptId)) state.scriptId = loaded.scriptId;
        if (typeof loaded.text === "string") state.text = loaded.text;
      }
    } catch (e) { /* ignore corrupt state */ }
  }

  function scriptById(id) {
    for (var i = 0; i < DATA.scripts.length; i++) if (DATA.scripts[i].id === id) return DATA.scripts[i];
    return null;
  }
  function activeScript() { return scriptById(state.scriptId) || DATA.scripts[0]; }

  /* ============================================================
     RENDER — script tabs
     ============================================================ */
  function renderScriptTabs() {
    var wrap = $("#scriptTabs");
    wrap.innerHTML = "";
    DATA.scripts.forEach(function (s) {
      var b = el("button", "scripttab" + (s.id === state.scriptId ? " is-active" : ""));
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", s.id === state.scriptId ? "true" : "false");
      b.dataset.id = s.id;

      var nm = el("span", "scripttab__name", s.name);
      b.appendChild(nm);
      if (s.status === "beta") {
        b.appendChild(el("span", "scripttab__beta", "beta"));
      }
      b.setAttribute("aria-label", s.name + (s.status === "beta" ? " (beta)" : ""));
      b.addEventListener("click", function () { setScript(s.id); });
      wrap.appendChild(b);
    });
  }

  function setScript(id) {
    if (!scriptById(id)) return;
    state.scriptId = id;
    save();
    renderAll();
    var input = $("#input");
    if (input) input.focus();
  }

  /* ============================================================
     RENDER — live preview
     ============================================================ */
  function renderPreview() {
    var s = activeScript();
    var out = transliterate(state.text, s);
    var pv = $("#preview");
    pv.textContent = out;
    pv.setAttribute("lang", s.lang);
    var isEmpty = state.text.trim() === "";
    $("#previewEmpty").hidden = !isEmpty;
    pv.hidden = isEmpty;
    $("#activeScriptName").textContent = s.name + (s.status === "beta" ? " · beta" : "");
    $("#fontHint").textContent = s.status === "beta"
      ? "Beta script — everyday words render well; some Sanskrit sounds map to the nearest letter. Needs a " + s.name + " font on your device."
      : "Needs a " + s.name + " font installed on your device to display. The copied text is correct either way.";
  }

  /* ============================================================
     INSERTION helpers (respect the textarea caret)
     ============================================================ */
  function insertAtCaret(text) {
    var ta = $("#input");
    var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    var end   = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    var caret = start + text.length;
    ta.setSelectionRange(caret, caret);
    ta.focus();
    state.text = ta.value;
    save();
    renderPreview();
  }

  /* ============================================================
     RENDER — common words
     ============================================================ */
  function renderWords() {
    var s = activeScript();
    var wrap = $("#wordChips");
    wrap.innerHTML = "";
    (s.words || []).forEach(function (pair) {
      var latin = pair[0], gloss = pair[1];
      var script = transliterate(latin, s);
      var chip = el("button", "chip");
      chip.type = "button";
      chip.setAttribute("role", "listitem");
      chip.setAttribute("aria-label", "Insert " + latin + " (" + gloss + ")");

      var g = el("span", "chip__glyph", script);
      g.setAttribute("lang", s.lang);
      var meta = el("span", "chip__meta");
      meta.appendChild(el("span", "chip__latin mono", latin));
      meta.appendChild(el("span", "chip__gloss", gloss));

      chip.appendChild(g);
      chip.appendChild(meta);
      chip.addEventListener("click", function () {
        // Insert the Latin spelling (not the glyph) so the word stays editable
        // and re-composes with the rest of the text. Add a separating space
        // only when the caret sits right after a non-space character.
        var ta = $("#input");
        var caret = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
        var before = ta.value.slice(0, caret);
        var needSpace = before.length > 0 && !/\s$/.test(before);
        insertAtCaret((needSpace ? " " : "") + latin + " ");
      });
      wrap.appendChild(chip);
    });
  }

  /* ============================================================
     RENDER — akshara grid
     ============================================================ */
  function gridCell(script, key, kind) {
    var glyph, exists = true;
    if (kind === "vowel") {
      var v = script.vowels[key];
      if (!v) { exists = false; glyph = ""; } else { glyph = v[0]; }   // independent form
    } else {
      var c = script.consonants[key];
      if (!c) { exists = false; glyph = ""; } else { glyph = c; }      // base cons + inherent a
    }
    if (!exists) return null;

    var cell = el("button", "key");
    cell.type = "button";
    var g = el("span", "key__glyph", glyph);
    g.setAttribute("lang", script.lang);
    var lat = el("span", "key__latin mono", key);
    cell.appendChild(g);
    cell.appendChild(lat);
    cell.setAttribute("aria-label", "Insert " + key + " " + glyph);
    cell.addEventListener("click", function () { insertAtCaret(key); });
    return cell;
  }

  function renderGrid() {
    var s = activeScript();
    var wrap = $("#aksharaGrid");
    wrap.innerHTML = "";

    var vRow = el("div", "akshara__row akshara__row--vowels");
    DATA.grid.vowelKeys.forEach(function (k) {
      var c = gridCell(s, k, "vowel");
      if (c) vRow.appendChild(c);
    });
    wrap.appendChild(el("div", "akshara__label", "Vowels"));
    wrap.appendChild(vRow);

    wrap.appendChild(el("div", "akshara__label", "Consonants"));
    var cGrid = el("div", "akshara__cons");
    DATA.grid.consonantRows.forEach(function (row) {
      row.forEach(function (k) {
        var c = gridCell(s, k, "cons");
        if (c) cGrid.appendChild(c);
      });
    });
    wrap.appendChild(cGrid);
  }

  /* ============================================================
     RENDER — cheat sheet (reference)
     ============================================================ */
  function renderReference() {
    var s = activeScript();

    // vowels: latin -> independent glyph, in a friendly order
    var vOrder = ["a","aa","i","ii","u","uu","R","e","E","ai","o","O","au"];
    var vList = $("#refVowels");
    vList.innerHTML = "";
    vOrder.forEach(function (k) {
      var v = s.vowels[k];
      if (!v) return;
      var li = el("li", "ref__row");
      li.appendChild(el("span", "ref__key mono", k));
      var g = el("span", "ref__glyph", v[0]); g.setAttribute("lang", s.lang);
      li.appendChild(g);
      vList.appendChild(li);
    });

    // marks
    var marks = [
      ["M / .n", "specials", "M", "anusvara (nasal)"],
      ["H", "specials", "H", "visarga"],
      [".N", "specials", ".N", "chandrabindu"],
      [".h", "halant", ".h", "halant (bare consonant)"]
    ];
    var mList = $("#refMarks");
    mList.innerHTML = "";
    marks.forEach(function (m) {
      var tableName = m[1], sampleKey = m[2];
      var glyph = tableName === "halant" ? (s.halant && s.halant[sampleKey]) : (s.specials && s.specials[sampleKey]);
      var li = el("li");
      li.appendChild(el("span", "ref__key mono", m[0]));
      if (glyph) {
        var g = el("span", "ref__inline-glyph", " " + glyph + " ");
        g.setAttribute("lang", s.lang);
        li.appendChild(g);
      }
      li.appendChild(document.createTextNode("— " + m[3]));
      mList.appendChild(li);
    });

    // digits 0-9
    var digs = [];
    for (var d = 0; d <= 9; d++) digs.push(s.digits[String(d)] || String(d));
    var dg = $("#refDigits");
    dg.textContent = "0–9  →  " + digs.join(" ");
    dg.setAttribute("lang", s.lang);
  }

  /* ============================================================
     COPY
     ============================================================ */
  function copyScript() {
    var s = activeScript();
    var text = transliterate(state.text, s);
    if (!text) { showToast("Nothing to copy yet — type something first."); return; }
    var done = function () { showToast("Script copied to clipboard"); };
    var fail = function () { fallbackCopy(text); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(ok ? "Script copied to clipboard" : "Press Ctrl/Cmd+C to copy");
    } catch (e) {
      showToast("Couldn't copy — select the preview and copy manually.");
    }
  }

  var toastTimer = null;
  function showToast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  /* ============================================================
     RENDER ALL
     ============================================================ */
  function renderAll() {
    renderScriptTabs();
    renderPreview();
    renderWords();
    renderGrid();
    renderReference();
  }

  /* ============================================================
     WIRE UP
     ============================================================ */
  function init() {
    load();
    var input = $("#input");
    input.value = state.text;

    input.addEventListener("input", function () {
      state.text = input.value;
      save();
      renderPreview();
    });

    $("#clearBtn").addEventListener("click", function () {
      input.value = "";
      state.text = "";
      save();
      renderPreview();
      input.focus();
    });

    $("#copyBtn").addEventListener("click", copyScript);

    // keyboard: arrow-key navigation across the script radiogroup
    $("#scriptTabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var tabs = $$(".scripttab", this);
      var idx = tabs.findIndex(function (t) { return t.dataset.id === state.scriptId; });
      if (idx === -1) return;
      var next = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      e.preventDefault();
      setScript(tabs[next].dataset.id);
      var el2 = $$(".scripttab")[next];
      if (el2) el2.focus();
    });

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
