# Visual Data Flow & Architecture Guide

Complete diagrams showing how every component works together.

---

## 1. COMPLETE DETECTION LIFECYCLE (Timeline)

```
┌─ USER VISITS WEBSITE ─────────────────────────────────────────────┐
│                                                                    │
│  TIME: 0ms                                                        │
│  Browser: <html>...</html> starts loading                        │
│                                                                    │
├─ TIME: 100ms ────────────────────────────────────────────────────┤
│  Chrome injects content scripts automatically                    │
│                                                                    │
│  CONTENT.JS RUNS:                                                │
│  ├─ Creates: ContentScriptCollector instance                    │
│  ├─ Calls: collectAllData()                                     │
│  │                                                               │
│  └─ COLLECTS 6 DATA SOURCES:                                    │
│     ├─ HTML Source Code                                         │
│     │  └─ Limit to first 100KB                                 │
│     │     (prevents memory issues)                              │
│     │                                                             │
│     ├─ DOM Elements                                             │
│     │  └─ querySelectorAll() for key selectors                 │
│     │     (meta tags, links, scripts)                          │
│     │                                                             │
│     ├─ JavaScript Globals                                       │
│     │  └─ Check window.* variables                             │
│     │     (jQuery, React, Vue, etc.)                           │
│     │                                                             │
│     ├─ Script Sources                                           │
│     │  └─ Extract <script src="..."> URLs                      │
│     │     (will pattern match these)                           │
│     │                                                             │
│     ├─ Cookies                                                  │
│     │  └─ chrome.cookies.getAll()                              │
│     │     (look for tech-specific cookie names)                │
│     │                                                             │
│     └─ HTTP Headers                                             │
│        └─ Already available in browser context                 │
│           (Server, X-Powered-By, etc.)                         │
│                                                                   │
├─ TIME: 150ms ────────────────────────────────────────────────────┤
│  Package data:                                                    │
│  pageData = {                                                    │
│    url: "https://example.com",                                  │
│    html: "<!DOCTYPE html>...",    // First 100KB                │
│    dom: { "meta[...]": "value" },                               │
│    js: { jQuery: "3.6.0", React: true },                        │
│    scripts: ["jquery.js", "react.js"],                          │
│    cookies: { "wp_logged_in": "..." },                          │
│    headers: { "Server": "Apache" }                              │
│  }                                                               │
│                                                                   │
│  SEND TO BACKGROUND:                                            │
│  chrome.runtime.sendMessage({                                   │
│    type: 'ANALYZE_PAGE',                                        │
│    data: pageData                                               │
│  })                                                              │
│                                                                   │
├─ TIME: 200ms ────────────────────────────────────────────────────┤
│  BACKGROUND.JS SERVICE WORKER RECEIVES:                         │
│  └─ Message listener triggered                                  │
│                                                                   │
│  LOADS TECHNOLOGY DATABASE:                                     │
│  └─ Fetch 27 JSON files from extension:                         │
│     ├─ categories.json           (tech categories)              │
│     ├─ technologies/_.json       (special chars)                │
│     ├─ technologies/a.json       (A-Frame, Apache, etc.)        │
│     ├─ technologies/b.json       (Backbone, Bootstrap, etc.)    │
│     ├─ ...                                                       │
│     └─ technologies/z.json       (Zendesk, etc.)                │
│                                                                   │
│  Parse into memory:                                             │
│  allTechnologies = [                                            │
│    {                                                             │
│      name: "React",                                             │
│      cats: [25],                 // Framework category           │
│      js: { "React.version": "pattern" },                        │
│      dom: ["div[data-reactroot]"],                              │
│      scriptSrc: "react.*.js",                                   │
│      implies: ["JavaScript"],                                   │
│      excludes: ["Vue", "Angular"]                               │
│    },                                                            │
│    ...                                                           │
│  ]                                                               │
│                                                                   │
├─ TIME: 250ms ────────────────────────────────────────────────────┤
│  INSTANTIATE DETECTOR:                                          │
│  detector = new Detector(allTechnologies)                       │
│                                                                   │
│  RUN DETECTION:                                                 │
│  results = detector.detect(pageData)                            │
│                                                                   │
├─ TIME: 300ms ────────────────────────────────────────────────────┤
│  DETECTOR RUNS 5 PARALLEL ANALYSIS METHODS:                     │
│                                                                   │
│  METHOD 1: analyzeHTML()                                        │
│  ├─ Loop: each technology                                       │
│  ├─ Get: tech.html patterns (regex)                             │
│  ├─ Test: regex.test(pageData.html)                             │
│  ├─ If match:                                                    │
│  │  ├─ Extract version (from capture groups)                   │
│  │  ├─ Calculate confidence                                    │
│  │  └─ Add to detections array                                 │
│  └─ Result: [detected techs from HTML]                         │
│                                                                   │
│  METHOD 2: analyzeDOM()                                         │
│  ├─ Loop: each technology                                       │
│  ├─ Get: tech.dom selectors                                     │
│  ├─ Run: document.querySelectorAll(selector)                   │
│  ├─ If found:                                                   │
│  │  ├─ Add to detections                                        │
│  │  └─ High confidence (95%)                                    │
│  └─ Result: [detected techs from DOM]                          │
│                                                                   │
│  METHOD 3: analyzeJS()                                          │
│  ├─ Loop: each technology                                       │
│  ├─ Get: tech.js variable names                                 │
│  ├─ Check: window[variable] exists?                            │
│  ├─ If found:                                                   │
│  │  ├─ Extract version from value                              │
│  │  └─ Add to detections (90%)                                 │
│  └─ Result: [detected techs from JS]                           │
│                                                                   │
│  METHOD 4: analyzeHeaders()                                     │
│  ├─ Loop: each technology                                       │
│  ├─ Get: tech.headers patterns                                  │
│  ├─ Check: HTTP headers match?                                  │
│  ├─ If match:                                                   │
│  │  ├─ Extract version                                         │
│  │  └─ Add to detections (85%)                                 │
│  └─ Result: [detected techs from headers]                      │
│                                                                   │
│  METHOD 5: analyzeScriptSrc()                                   │
│  ├─ Loop: each technology                                       │
│  ├─ Get: tech.scriptSrc patterns                                │
│  ├─ Test: each script URL against regex                        │
│  ├─ If match:                                                   │
│  │  ├─ Extract version (from URL)                              │
│  │  └─ Add to detections (90%)                                 │
│  └─ Result: [detected techs from scripts]                      │
│                                                                   │
├─ TIME: 350ms ────────────────────────────────────────────────────┤
│  COMBINE ALL DETECTIONS:                                        │
│  allDetections = [                                              │
│    {tech: "React", confidence: 90, source: "js"},               │
│    {tech: "React", confidence: 95, source: "dom"},              │
│    {tech: "jQuery", confidence: 85, source: "scriptSrc"},       │
│    {tech: "Webpack", confidence: 80, source: "html"},           │
│    ...                                                           │
│  ]                                                               │
│                                                                   │
│  CONFIDENCE STACKING:                                           │
│  React appears twice:                                           │
│    90% (from JS) + 95% (from DOM) = Math.min(100, 185) = 100%  │
│                                                                   │
│  RESOLVE IMPLIES:                                               │
│  React implies: JavaScript                                      │
│  jQuery implies: JavaScript                                     │
│  Webpack implies: JavaScript, Node.js                           │
│  ├─ Add implied techs to results                               │
│  ├─ Lower their confidence (min with parent)                   │
│  └─ Continue until no new implies found                        │
│                                                                   │
│  RESOLVE EXCLUDES:                                              │
│  if (ReactDetected) remove Vue, Angular                         │
│  if (WordPressDetected) remove Joomla, Drupal                  │
│  └─ Prevents false positives                                   │
│                                                                   │
│  MERGE FINAL RESULTS:                                           │
│  {                                                               │
│    "React": { confidence: 100, version: "17.0.2", ... },       │
│    "jQuery": { confidence: 100, version: "3.6.0", ... },       │
│    "Webpack": { confidence: 95, version: "5.40", ... },        │
│    "JavaScript": { confidence: 100, ... },                     │
│    "Node.js": { confidence: 85, ... }                          │
│  }                                                               │
│                                                                   │
├─ TIME: 400ms ────────────────────────────────────────────────────┤
│  CACHE RESULTS:                                                 │
│                                                                   │
│  In Memory (fast but temporary):                                │
│  detectionCache[tabId] = {                                      │
│    detections: [...results...],                                 │
│    url: "https://example.com",                                  │
│    lastAnalyzed: "2024-01-31T10:00:00Z"                         │
│  }                                                               │
│                                                                   │
│  In Local Storage (persistent):                                 │
│  chrome.storage.local.set({                                     │
│    "domain_example.com": {                                      │
│      detections: [...results...],                               │
│      timestamp: 1704067200000,   // 48-hour TTL                │
│      url: "https://example.com"                                 │
│    }                                                             │
│  })                                                              │
│                                                                   │
├─ TIME: 450ms ────────────────────────────────────────────────────┤
│  UPDATE UI:                                                     │
│  chrome.action.setBadgeText({                                   │
│    text: "5",     // Number of technologies                    │
│    tabId: tabId                                                │
│  })                                                              │
│                                                                   │
│  Extension icon shows number badge                             │
│                                                                   │
├─ TIME: 500ms ────────────────────────────────────────────────────┤
│  USER CLICKS EXTENSION ICON:                                    │
│  └─ popup.html displays                                         │
│                                                                   │
│  POPUP.JS REQUESTS DATA:                                        │
│  chrome.runtime.sendMessage({                                   │
│    type: 'GET_CACHED_RESULTS'                                   │
│  })                                                              │
│                                                                   │
│  BACKGROUND RESPONDS:                                           │
│  └─ Sends cached results immediately                            │
│                                                                   │
│  POPUP RENDERS:                                                 │
│  ├─ React 17.0.2  [icon] [link to learn more]                  │
│  ├─ jQuery 3.6.0  [icon] [link to learn more]                  │
│  ├─ Webpack 5.40  [icon] [link to learn more]                  │
│  ├─ JavaScript    [icon] [link to learn more]                  │
│  └─ Node.js       [icon] [link to learn more]                  │
│                                                                   │
└─ TIME: 550ms ────────────────────────────────────────────────────┘

TOTAL TIME: ~550ms from page load to showing results
```

---

## 2. COMPONENT INTERACTION DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                       CHROME BROWSER                             │
│                                                                   │
│  ┌──────────────────┐                  ┌─────────────────────┐  │
│  │  WEBPAGE HTML    │                  │   USER INTERFACE    │  │
│  │                  │                  │                     │  │
│  │ - Meta tags      │                  │  Extension Popup    │  │
│  │ - Scripts        │                  │  Shows detected     │  │
│  │ - Global vars    │                  │  technologies       │  │
│  │ - DOM elements   │                  │                     │  │
│  └────────┬─────────┘                  └────────────────────┘   │
│           │                                    ▲                 │
│           │                                    │                 │
│           │ (1) Data collection              │ (6) Results      │
│           │                                    │                 │
│           ▼                                    │                 │
│  ┌──────────────────────────────────────────┐│                 │
│  │        CONTENT SCRIPT                    ││                 │
│  │  (content.js)                            ││                 │
│  │                                          ││                 │
│  │  ContentScriptCollector instance         ││                 │
│  │                                          ││                 │
│  │  collectAllData() collects:              ││                 │
│  │  - HTML source code                      ││                 │
│  │  - DOM elements (querySelectorAll)       ││                 │
│  │  - JavaScript globals (window.*)         ││                 │
│  │  - Script <src> URLs                     ││                 │
│  │  - Cookies                               ││                 │
│  │  - HTTP headers                          ││                 │
│  │                                          ││                 │
│  │  Packages into pageData object           ││                 │
│  └──────────────┬───────────────────────────┘│                 │
│                 │                             │                 │
│      (2) sendMessage()                        │                 │
│         with pageData                         │                 │
│                 │                             │                 │
│                 ▼                             │                 │
│  ╔════════════════════════════════════════════╗                 │
│  ║  SERVICE WORKER (background.js)            ║                 │
│  ║  Isolated context - runs in background     ║                 │
│  ║                                            ║                 │
│  ║  (3) Receives message & data               ║                 │
│  ║                                            ║                 │
│  ║  ┌──────────────────────────────────────┐ ║                 │
│  ║  │ Load Technology Database             │ ║                 │
│  ║  │                                      │ ║                 │
│  ║  │ Fetch 27 JSON files:                │ ║                 │
│  ║  │ ├─ categories.json                  │ ║                 │
│  ║  │ ├─ technologies/_.json              │ ║                 │
│  ║  │ ├─ technologies/a.json              │ ║                 │
│  ║  │ ├─ ...                              │ ║                 │
│  ║  │ └─ technologies/z.json              │ ║                 │
│  ║  │                                      │ ║                 │
│  ║  │ allTechnologies = [                 │ ║                 │
│  ║  │   {React, jQuery, WordPress, ...}  │ ║                 │
│  ║  │ ]                                    │ ║                 │
│  ║  └──────────────────────────────────────┘ ║                 │
│  ║                                            ║                 │
│  ║  (4) Instantiate Detector                  ║                 │
│  ║  detector = new Detector(allTechnologies)  ║                 │
│  ║                                            ║                 │
│  ║  ┌──────────────────────────────────────┐ ║                 │
│  ║  │ Detector.detect(pageData)            │ ║                 │
│  ║  │                                      │ ║                 │
│  ║  │ Runs 5 parallel methods:             │ ║                 │
│  ║  │  1. analyzeHTML(html)                │ ║                 │
│  ║  │  2. analyzeDOM(dom)                  │ ║                 │
│  ║  │  3. analyzeJS(js)                    │ ║                 │
│  ║  │  4. analyzeHeaders(headers)          │ ║                 │
│  ║  │  5. analyzeScriptSrc(scripts)        │ ║                 │
│  ║  │                                      │ ║                 │
│  ║  │ Returns merged detections with       │ ║                 │
│  ║  │ confidence scores                    │ ║                 │
│  ║  └──────────────────────────────────────┘ ║                 │
│  ║                                            ║                 │
│  ║  (5) Cache & Persist                       ║                 │
│  ║  ├─ Memory: detectionCache[tabId]          ║                 │
│  ║  └─ Storage: chrome.storage.local          ║                 │
│  ║                                            ║                 │
│  ║  (6) Send response back to popup           ║                 │
│  ╚════════════════════════════════════════════╝                 │
│                 │                             │                 │
│                 │                             │                 │
│                 └─────────────────────────────┘                 │
│                       sendResponse()                            │
│                                                                   │
│  ┌──────────────────────────────────────────┐                  │
│  │  POPUP DISPLAY (popup.html/popup.js)     │                  │
│  │                                          │                  │
│  │  Receives response with results:         │                  │
│  │  ├─ React 17.0.2 (100% confidence)      │                  │
│  │  ├─ jQuery 3.6.0 (100% confidence)      │                  │
│  │  ├─ Webpack 5.40 (95% confidence)       │                  │
│  │  ├─ JavaScript (100% confidence)        │                  │
│  │  └─ Node.js (85% confidence)            │                  │
│  │                                          │                  │
│  │  Renders with:                           │                  │
│  │  ├─ Technology icons                     │                  │
│  │  ├─ Confidence percentages               │                  │
│  │  ├─ Version numbers                      │                  │
│  │  └─ Category badges                      │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. PATTERN MATCHING FLOW (Detailed)

```
TECHNOLOGY DEFINITION:
{
  "WordPress": {
    "js": {
      "wp": "",
      "wpApiSettings": ""
    },
    "dom": [
      "link[rel='https://api.w.org/']",
      "meta[name='generator'][content*='WordPress']"
    ],
    "scriptSrc": "wp-content/.*\\.js",
    "implies": ["PHP", "MySQL", "Apache"]
  }
}

PAGE DATA COLLECTED:
{
  "html": "<!DOCTYPE html><html>...<meta name='generator' content='WordPress 5.8'>...",
  "dom": {
    "meta[name='generator']": "WordPress 5.8"
  },
  "js": {
    "wp": {symbol object},
    "wpApiSettings": {...}
  },
  "scripts": [
    "https://example.com/wp-content/uploads/plugin.js",
    "https://example.com/wp-includes/theme.js"
  ]
}

┌─ DETECTION FLOW ──────────────────────────────────────────────┐
│                                                                 │
│  ┌─ METHOD 1: analyzeJS() ──────────────────────────────────┐ │
│  │                                                           │ │
│  │  Check: tech.js = { "wp": "", "wpApiSettings": "" }     │ │
│  │                                                           │ │
│  │  Test 1: Does window.wp exist?                          │ │
│  │  ├─ YES → window.wp !== undefined                       │ │
│  │  ├─ Add detection: confidence = 80%                     │ │
│  │  └─ Source: "js"                                        │ │
│  │                                                           │ │
│  │  Test 2: Does window.wpApiSettings exist?               │ │
│  │  ├─ YES → window.wpApiSettings !== undefined            │ │
│  │  ├─ Add detection: confidence = 75%                     │ │
│  │  └─ Source: "js"                                        │ │
│  │                                                           │ │
│  │  Result: [                                              │ │
│  │    {tech: "WordPress", confidence: 80, source: "js"},  │ │
│  │    {tech: "WordPress", confidence: 75, source: "js"}   │ │
│  │  ]                                                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ METHOD 2: analyzeDOM() ──────────────────────────────────┐ │
│  │                                                           │ │
│  │  Check: tech.dom = ["link[rel='...']", "meta[...]"]    │ │
│  │                                                           │ │
│  │  Selector 1: "link[rel='https://api.w.org/']"          │ │
│  │  ├─ querySelectorAll(selector) → 0 matches              │ │
│  │  └─ No detection                                         │ │
│  │                                                           │ │
│  │  Selector 2: "meta[name='generator'][content*='..']"   │ │
│  │  ├─ querySelectorAll(selector) → 1 match found          │ │
│  │  ├─ <meta name="generator" content="WordPress 5.8">    │ │
│  │  ├─ Add detection: confidence = 95%                     │ │
│  │  └─ Source: "dom"                                       │ │
│  │                                                           │ │
│  │  Result: [                                              │ │
│  │    {tech: "WordPress", confidence: 95, source: "dom"}  │ │
│  │  ]                                                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ METHOD 5: analyzeScriptSrc() ───────────────────────────┐ │
│  │                                                           │ │
│  │  Check: tech.scriptSrc = "wp-content/.*\\.js"           │ │
│  │                                                           │ │
│  │  Convert to regex: /wp-content\/.*\.js/i                │ │
│  │                                                           │ │
│  │  Test script 1: "https://example.com/wp-content/..."   │ │
│  │  ├─ Regex test: /wp-content\/.*\.js/i.test(...) → true │ │
│  │  ├─ Add detection: confidence = 95%                     │ │
│  │  └─ Source: "scriptSrc"                                 │ │
│  │                                                           │ │
│  │  Test script 2: "https://example.com/wp-includes/..."  │ │
│  │  ├─ Regex test: /wp-content\/.*\.js/i.test(...) → false│ │
│  │  └─ No detection                                         │ │
│  │                                                           │ │
│  │  Result: [                                              │ │
│  │    {tech: "WordPress", confidence: 95, source: "src"}  │ │
│  │  ]                                                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

COMBINE ALL DETECTIONS:
detections = [
  {tech: "WordPress", confidence: 80, source: "js"},
  {tech: "WordPress", confidence: 75, source: "js"},
  {tech: "WordPress", confidence: 95, source: "dom"},
  {tech: "WordPress", confidence: 95, source: "scriptSrc"}
]

CONFIDENCE STACKING:
WordPress appears 4 times:
  80% + 75% + 95% + 95% = 345% → Math.min(100, 345%) = 100%

FINAL RESULT: WordPress 100% confidence

RESOLVE IMPLIES:
WordPress found → add:
  - PHP (min(100, 90)) = 90% confidence
  - MySQL (min(100, 80)) = 80% confidence
  - Apache (min(100, 75)) = 75% confidence

EXCLUDE CONTRADICTIONS:
if WordPress found → remove: Joomla, Drupal

FINAL OUTPUT:
{
  "WordPress": 100% confidence,
  "PHP": 90% confidence,
  "MySQL": 80% confidence,
  "Apache": 75% confidence
}
```

---

## 4. DATA STORAGE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│            CHROME EXTENSION STORAGE LAYERS                  │
└─────────────────────────────────────────────────────────────┘

LAYER 1: MEMORY (Fastest - Cleared on Extension Reload)
┌──────────────────────────────────────────────────┐
│  detectionCache[tabId]                           │
│  ├─ tabId = 1234                                │
│  │  ├─ detections: [...]                        │
│  │  ├─ url: "https://example.com"              │
│  │  └─ lastAnalyzed: "2024-01-31T10:00:00Z"   │
│  ├─ tabId = 5678                                │
│  │  └─ {...}                                     │
│  └─ Cleared when tab closes                     │
└──────────────────────────────────────────────────┘
Used for: Quick access to popup results

LAYER 2: CHROME LOCAL STORAGE (Persistent - Survives Restarts)
┌──────────────────────────────────────────────────┐
│  chrome.storage.local                            │
│                                                   │
│  domain_example.com:                            │
│  ├─ detections: [...]                           │
│  ├─ timestamp: 1704067200000                   │
│  └─ url: "https://example.com"                 │
│                                                   │
│  domain_github.com:                             │
│  ├─ detections: [...]                           │
│  ├─ timestamp: 1704067200000                   │
│  └─ url: "https://github.com"                  │
│                                                   │
│  allTechnologies: [{...}, ...]    // Backup db  │
│  categories: [{...}, ...]         // Categories  │
│                                                   │
│  Cache TTL: 48 hours (172800000ms)              │
└──────────────────────────────────────────────────┘
Used for: Persist data across sessions

LAYER 3: DETECTION FLOW
┌──────────────────────────────────────────────────┐
│  PAGE VISIT                                      │
│       ↓                                          │
│  Check: detectionCache[tabId] exists?           │
│  ├─ YES → Use cached (fast path)                │
│  └─ NO → Run detection (slow path)              │
│       ↓                                          │
│  Check: chrome.storage.local has domain?        │
│  ├─ YES → Use if not expired (48h TTL)         │
│  └─ NO → Run content script → detect           │
│       ↓                                          │
│  Store in detectionCache[tabId]                 │
│       ↓                                          │
│  Store in chrome.storage.local (persistent)    │
│       ↓                                          │
│  Ready for popup display                        │
└──────────────────────────────────────────────────┘

CLEANUP OPERATIONS:
├─ When tab closes:
│  └─ delete detectionCache[tabId]
│
├─ On extension startup:
│  └─ Check TTL on all cached domains
│     └─ Remove if > 48 hours old
│
└─ User action:
   └─ clear() button clears chrome.storage.local
```

---

This visual guide maps out exactly how data flows through your extension!
