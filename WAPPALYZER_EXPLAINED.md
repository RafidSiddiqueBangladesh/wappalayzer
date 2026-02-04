# How Wappalyzer Works - Complete Technical Breakdown

## Quick Summary

**What Wappalyzer Does:** Detects what technologies power any website by analyzing 6 different data sources simultaneously.

**How Long It Takes:** ~500ms from page load to showing results

**How Accurate:** Combines multiple detection methods = 100% confidence when all methods match

---

## The 6 Data Sources Wappalyzer Analyzes

| Source | Example | Why It Works |
|--------|---------|-------------|
| **HTML Source** | `<meta name="generator" content="WordPress">` | CMS/platforms embed info in HTML |
| **DOM Elements** | `link[rel="https://api.w.org/"]` | Specific selectors indicate tech |
| **JavaScript Globals** | `window.jQuery.fn.jquery` | Libraries create global variables |
| **Script Sources** | `<script src="/wp-content/theme.js">` | URL patterns reveal technologies |
| **HTTP Headers** | `X-Powered-By: PHP/7.4` | Servers announce themselves |
| **Cookies** | Cookie named `wp_logged_in` | Platforms use specific cookie names |

---

## Architecture (The 4 Main Components)

### **1. Content Script (content.js)**
- Runs on EVERY page you visit
- Collects data from 6 sources
- Sends to background worker
- Takes ~100ms

**Code Path:**
```
User visits website
    ↓
content.js injects ContentScriptCollector
    ↓
collectAllData() gathers HTML, DOM, JS, scripts, cookies
    ↓
chrome.runtime.sendMessage() to background
```

### **2. Service Worker (background.js)**
- Receives data from content script
- Loads all 5,000+ technology patterns from JSON
- Runs the detection engine
- Caches results
- Takes ~150ms

**Code Path:**
```
Message received from content.js
    ↓
Load allTechnologies array (from 27 JSON files)
    ↓
Instantiate Detector class
    ↓
detector.detect(pageData)
    ↓
Cache results in chrome.storage.local + detectionCache
```

### **3. Detection Engine (detector.js)**
- The core pattern-matching logic
- 5 parallel analysis methods
- Resolves dependencies (implies/excludes)
- Returns merged results with confidence scores

**The 5 Analysis Methods:**
```javascript
1. analyzeHTML()      - Test regex against page source
2. analyzeDOM()       - Run CSS selectors (querySelectorAll)
3. analyzeJS()        - Check window.* global variables
4. analyzeHeaders()   - Match HTTP response headers
5. analyzeScriptSrc() - Pattern match on script URLs
```

### **4. Popup UI (popup.js + popup.html)**
- Shows detected technologies
- Requests results from background via `sendMessage()`
- Displays with icons, versions, categories
- Takes ~50ms to render

---

## The Detection Workflow (Timeline)

```
0ms    → Page starts loading
50ms   → Browser renders initial HTML
100ms  → content.js injects & starts collecting
150ms  → Data sent to background worker
200ms  → background.js loads 27 technology JSON files
250ms  → Detector class processes data
300ms  → Pattern matching runs (5 methods in parallel)
350ms  → Confidence calculated & stacked
400ms  → Dependencies resolved (implies/excludes)
450ms  → Results cached in storage
500ms  → User clicks icon → popup displays results
```

---

## How Pattern Matching Works (Example: WordPress Detection)

### **The Technology Definition**
```json
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
```

### **The Detection Process**

**Method 1: Check JavaScript (analyzeJS)**
```javascript
// Does window.wp exist?
if (window.wp !== undefined) {
  confidence += 80%
}
```

**Method 2: CSS Selector (analyzeDOM)**
```javascript
// querySelectorAll("meta[name='generator'][content*='WordPress']")
// Found: <meta name="generator" content="WordPress 5.8">
// Match: /wordpress/i → confidence += 90%
```

**Method 3: Script URL Pattern (analyzeScriptSrc)**
```javascript
// Test: <script src="/wp-content/plugins/plugin.js">
// Regex: /wp-content\/.*\.js/ → MATCH
// confidence += 95%
```

**Method 4: Merge Detections**
```javascript
// Total: Math.min(100, 80 + 90 + 95) = 100%
// Version: "5.8" (extracted from meta tag)
```

**Method 5: Resolve Implies**
```javascript
// WordPress found → automatically add:
//   - PHP (90% confidence)
//   - MySQL (80% confidence) 
//   - Apache (75% confidence)
```

**Final Result:**
```
✓ WordPress 5.8 (100% confidence)
✓ PHP (90% confidence)
✓ MySQL (80% confidence)
✓ Apache (75% confidence)
```

---

## The Technology Database Structure

Wappalyzer uses **27 JSON files** organized alphabetically:

```
technologies/
├── _.json        (500+ technologies starting with special chars)
├── a.json        (WordPress, Apache, Angular, etc.)
├── b.json        (Backbone, Bootstrap, etc.)
├── c.json        (Craft, Cloudflare, etc.)
├── ...
└── z.json        (Zendesk, etc.)
```

**Each Technology Has:**
```json
{
  "name": "Technology Name",
  "categories": [1, 2, 3],        // CMS, Framework, Library, etc.
  "website": "https://...",
  "icon": "icon.svg",
  "js": { ... },                  // JavaScript global detection
  "dom": [ ... ],                 // CSS selector detection
  "html": [ ... ],                // HTML pattern detection
  "headers": { ... },             // HTTP header detection
  "scriptSrc": [ ... ],           // Script URL detection
  "implies": ["PHP", "MySQL"],    // Implied dependencies
  "excludes": ["Joomla"]          // Contradicting techs
}
```

---

## Why Confidence Stacking Works

**Single Detection = Low Confidence:**
```javascript
Found "jQuery" in HTML only? → 60% confidence
```

**Multiple Detections = High Confidence:**
```javascript
Found "jQuery" in:
  - window.jQuery variable   → 90%
  - <script> tag URL        → 85%
  - HTML comment            → 75%

Total: Math.min(100, 90 + 85 + 75) = 100%
```

**Reason:** If technology is detected multiple ways independently, it's definitely there.

---

## Data Persistence (Caching)

Wappalyzer caches results two ways:

### **1. Memory Cache (Fast - Per Tab)**
```javascript
detectionCache[tabId] = {
  detections: [ ... ],
  url: "https://example.com",
  lastAnalyzed: "2024-01-31T10:00:00Z"
}
```
- Cleared when tab closes
- Used when popup opens on same tab

### **2. Local Storage (Persistent - Per Domain)**
```javascript
chrome.storage.local.set({
  "domain_example.com": {
    detections: [ ... ],
    timestamp: 1704067200000  // 48-hour TTL
  }
})
```
- Survives extension restart
- Re-used on re-visiting domain
- Speeds up popup display

---

## Network Request Flow

```
┌─────────────────────┐
│   User's Browser    │
│  Page loads HTML    │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│   content.js runs    │
│ Collects 6 data      │
│ sources              │
└──────────┬───────────┘
           │
           │ chrome.runtime.sendMessage({
           │   type: 'ANALYZE_PAGE',
           │   data: pageData
           │ })
           │
           ▼
┌─────────────────────────────┐
│  background.js (Service)    │
│  - Load 27 JSON files       │
│  - Instantiate Detector     │
│  - Run 5 analysis methods   │
│  - Merge & cache            │
└──────────┬──────────────────┘
           │
           │ Stores result
           │
           ▼
┌─────────────────────────────┐
│  chrome.storage.local       │
│  + detectionCache[tabId]    │
└──────────┬──────────────────┘
           │
           │ User clicks popup
           │
           ▼
┌─────────────────────────────┐
│  popup.js requests result   │
│  chrome.runtime.sendMessage │
│  ({type: 'GET_CACHED_...'}) │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  background responds with   │
│  cached detections          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  popup.html renders:        │
│  ✓ React 17.0               │
│  ✓ Webpack 5.x              │
│  ✓ AWS                      │
│  ✓ Google Analytics         │
└─────────────────────────────┘
```

---

## Performance Optimization Techniques Used

1. **Limit HTML Analysis**
   - Only scans first 100KB of HTML
   - Prevents analyzing huge pages

2. **Parallel Analysis**
   - Runs 5 detection methods simultaneously
   - Faster than sequential

3. **Early Termination**
   - Stop analyzing once confidence reaches 100%
   - Skip unnecessary pattern tests

4. **Caching**
   - Store results per domain
   - Re-use on repeat visits

5. **Debouncing**
   - Don't re-analyze same page multiple times
   - Wait for tab to fully load before starting

6. **Memory Management**
   - Clear cache when tabs close
   - Don't store full HTML in memory

---

## Technology Categories (27 Total)

Wappalyzer organizes technologies into categories like:

- **CMS**: WordPress, Joomla, Drupal
- **Frameworks**: React, Vue, Angular
- **Languages**: PHP, Java, Python, Node.js
- **Servers**: Apache, Nginx, IIS
- **Databases**: MySQL, PostgreSQL, MongoDB
- **Analytics**: Google Analytics, Mixpanel
- **CDN**: Cloudflare, Akamai, CloudFront
- **Hosting**: AWS, Azure, Google Cloud
- **Security**: Cloudflare, Sucuri, Wordfence
- **Payment**: Stripe, PayPal, Square

---

## Real-World Example: Complete Detection

### Website: github.com

**Data Collection (content.js):**
```
HTML: <meta name="generator" content="">
Scripts: https://github.githubassets.com/assets/app-a1234.js
Global: window.GitHub = {...}
Headers: Server: GitHub.com
```

**Analysis (detector.js):**
```
✓ analyzeHTML() → No match
✓ analyzeDOM() → GitHub icon detected
✓ analyzeJS() → window.GitHub found → 90% confidence
✓ analyzeHeaders() → Server: GitHub.com → 80% confidence
✓ analyzeScriptSrc() → GitHub assets URL → 85% confidence
```

**Merge (confidence stacking):**
```
Total: Math.min(100, 90 + 80 + 85) = 100%
Result: GitHub 100% confidence
```

**Implies Resolution:**
```
GitHub implies:
  - Cloudflare CDN (95%)
  - Ruby on Rails (90%)
  - PostgreSQL (85%)
```

**Final Output:**
```
✓ GitHub (100%)
✓ Cloudflare (95%)
✓ Ruby on Rails (90%)
✓ PostgreSQL (85%)
```

---

## Key Takeaways for Building Your Own

1. **Data sources matter** - More sources = higher confidence
2. **Pattern format is important** - Use Wappalyzer's `\\;version:\\1` syntax
3. **Dependencies are crucial** - `implies` and `excludes` prevent false positives
4. **Caching is essential** - Store results to avoid re-analyzing
5. **Parallel processing is fast** - Run all 5 analysis methods together
6. **Confidence stacking works** - Multiple weak signals = strong detection

---

This is how Wappalyzer achieves 99%+ accuracy across millions of websites!
