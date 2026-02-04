# Wappalyzer Copy-Paste Code Patterns

Quick reference for building your own tool. Copy these patterns exactly.

---

## 1. Detection Pattern Format (technologies/*.json)

### Pattern 1: Detect by JavaScript Variable with Version
```json
{
  "React": {
    "cats": [25],
    "js": {
      "React.version": "^(.+)$\\;version:\\1"
    }
  }
}
```
**Explanation:**
- `React.version` → Check window.React.version
- `^(.+)$` → Capture entire version string (group 1)
- `\\;version:\\1` → Extract group 1 as version

### Pattern 2: Detect by CSS Selector
```json
{
  "WordPress": {
    "cats": [1],
    "dom": [
      "link[rel='https://api.w.org/']",
      "meta[name='generator'][content*='WordPress']"
    ]
  }
}
```
**Explanation:**
- Any element matching CSS selector = technology detected
- `[content*='WordPress']` = attribute contains "WordPress"

### Pattern 3: Detect by Script URL Pattern
```json
{
  "jQuery": {
    "cats": [27],
    "scriptSrc": "jquery(?:\\.min)?\\.js\\;version:([\\d.]+)"
  }
}
```
**Explanation:**
- Regex match on `<script src="...">` attributes
- `jquery(?:\\.min)?\\.js` = matches jquery.js or jquery.min.js
- `\\;version:([\\d.]+)` = Extract digits separated by dots

### Pattern 4: Detect by HTTP Header
```json
{
  "Apache": {
    "cats": [22],
    "headers": {
      "Server": "Apache(?:\\/([\\d.]+))?\\;version:\\1\\;confidence:95"
    }
  }
}
```
**Explanation:**
- Match HTTP response headers
- `Server: Apache/2.4.41`
- Extract version if present, set confidence 95%

### Pattern 5: Detect by HTML Content
```json
{
  "Joomla": {
    "cats": [1],
    "html": "<meta name=\"generator\" content=\"Joomla[^\"]*\""
  }
}
```
**Explanation:**
- Regex pattern in page HTML source
- `<meta name="generator" content="Joomla..."`

### Pattern 6: Combined Detection with Implies
```json
{
  "WordPress": {
    "cats": [1],
    "js": {"wp": ""},
    "dom": "link[rel='https://api.w.org/']",
    "scriptSrc": "wp-content/.*\\.js",
    "implies": ["PHP", "MySQL", "Apache"],
    "excludes": ["Joomla", "Drupal"]
  }
}
```
**Explanation:**
- Multiple detection methods
- `implies` → Add these when detected
- `excludes` → Remove if found

---

## 2. Confidence & Version Extraction Patterns

### Extract Version from Capture Group
```javascript
// Pattern: "^([\\d.]+)$\\;version:\\1"
// Input: window.React.version = "17.0.2"
// Result: version = "17.0.2" (from capture group \\1)
```

### Conditional Version (Ternary Operator)
```javascript
// Pattern: "(?:v)?([\\d.]+)?\\;version:v\\1?v\\1:unknown"
// If match: return "v" + group1
// Else: return "unknown"
```

### Multiple Capture Groups
```javascript
// Pattern: "v([\\d]+)\\.([\\d]+)\\;version:\\1.\\2"
// Matches: "v3.6"
// Result: version = "3.6" (combines group 1 and 2)
```

### Set Custom Confidence
```json
{
  "MyTech": {
    "scriptSrc": "mytech\\.js\\;confidence:85"
  }
}
```
**Explanation:**
- Default confidence = 100%
- This sets it to 85%
- Use when pattern could have false positives

---

## 3. Content Script (js/content.js) - Complete Template

```javascript
'use strict'

class ContentScriptCollector {
  async collectAllData() {
    const pageData = {
      url: document.location.href,
      html: document.documentElement.innerHTML.slice(0, 100000),
      dom: this.analyzeDOMElements(),
      js: this.analyzeJavaScriptGlobals(),
      headers: {},
      scripts: this.getScriptSources(),
      cookies: await this.getCookieData()
    };

    return pageData;
  }

  analyzeDOMElements() {
    const elements = {};

    // Collect all meta tags
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        elements[`meta[name='${name}']`] = content;
      }
    });

    // Collect link tags
    document.querySelectorAll('link[rel]').forEach(link => {
      const href = link.getAttribute('href');
      const rel = link.getAttribute('rel');
      if (href) {
        elements[`link[rel='${rel}']`] = href;
      }
    });

    return elements;
  }

  analyzeJavaScriptGlobals() {
    const jsGlobals = {};
    
    const varsToCheck = [
      'jQuery', 'React', 'Vue', 'Angular', 'Ember', 'Backbone',
      'gtag', '_gat', '_gaq', 'ga',
      'FB', 'twttr', 'linkedIn', 'Shopify', 'wp', 'drupalSettings',
      'OpenAI', 'Claude', 'anthropic', 'google'
    ];

    varsToCheck.forEach(varName => {
      try {
        const value = eval(`typeof window.${varName} !== 'undefined' ? window.${varName} : undefined`);
        if (value !== undefined) {
          const version = value?.version || value?.VERSION || value?._version || '';
          jsGlobals[varName] = version || true;
        }
      } catch (e) {
        // Skip if can't access
      }
    });

    return jsGlobals;
  }

  getScriptSources() {
    const scripts = [];
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        scripts.push(src);
      }
    });
    return scripts;
  }

  async getCookieData() {
    try {
      const cookies = await chrome.cookies.getAll({ url: document.location.href });
      const cookieObj = {};
      cookies.forEach(cookie => {
        cookieObj[cookie.name] = cookie.value.slice(0, 100);
      });
      return cookieObj;
    } catch (e) {
      return {};
    }
  }

  setupNetworkMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      chrome.runtime.sendMessage({
        type: 'NETWORK_REQUEST',
        url: url,
        timestamp: Date.now()
      }).catch(() => {});
      return originalFetch.apply(this, args);
    };
  }
}

const collector = new ContentScriptCollector();

(async () => {
  try {
    const pageData = await collector.collectAllData();
    
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PAGE',
      data: pageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
      }
    });

    collector.setupNetworkMonitoring();
  } catch (error) {
    console.error('Content script error:', error);
  }
})();
```

---

## 4. Detection Engine (js/detector.js) - Core Template

```javascript
class Detector {
  constructor(technologies) {
    this.technologies = technologies;
  }

  detect(pageData) {
    const detections = [];

    detections.push(...this.analyzeHTML(pageData.html));
    detections.push(...this.analyzeDOM(pageData.dom));
    detections.push(...this.analyzeJS(pageData.js));
    detections.push(...this.analyzeHeaders(pageData.headers));
    detections.push(...this.analyzeScriptSrc(pageData.scripts));

    this.resolveImplies(detections);
    this.resolveExcludes(detections);

    return this.mergeDetections(detections);
  }

  analyzeHTML(html) {
    const detections = [];
    this.technologies.forEach((tech) => {
      if (!tech.html) return;
      const patterns = Array.isArray(tech.html) ? tech.html : [tech.html];
      patterns.forEach((pattern) => {
        const { regex, version } = this.parsePattern(pattern);
        if (regex.test(html)) {
          const match = html.match(regex);
          detections.push({
            technology: tech.name,
            confidence: 90,
            version: this.extractVersion(version, match),
            source: 'html'
          });
        }
      });
    });
    return detections;
  }

  analyzeDOM(domElements) {
    const detections = [];
    this.technologies.forEach((tech) => {
      if (!tech.dom) return;
      const selectors = Array.isArray(tech.dom) ? tech.dom : [tech.dom];
      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            detections.push({
              technology: tech.name,
              confidence: 95,
              source: 'dom'
            });
          }
        } catch (e) {}
      });
    });
    return detections;
  }

  analyzeJS(jsVariables) {
    const detections = [];
    this.technologies.forEach((tech) => {
      if (!tech.js) return;
      Object.keys(tech.js).forEach((variable) => {
        const value = this.getNestedProperty(window, variable);
        if (value !== undefined) {
          const pattern = tech.js[variable];
          const { version } = this.parsePattern(pattern);
          detections.push({
            technology: tech.name,
            confidence: 90,
            version: version || (typeof value === 'string' ? value : ''),
            source: 'js'
          });
        }
      });
    });
    return detections;
  }

  analyzeHeaders(headers) {
    const detections = [];
    this.technologies.forEach((tech) => {
      if (!tech.headers) return;
      Object.keys(tech.headers).forEach((headerName) => {
        const headerValue = headers[headerName.toLowerCase()];
        if (headerValue) {
          const pattern = tech.headers[headerName];
          const { regex, version } = this.parsePattern(pattern);
          if (regex.test(headerValue)) {
            const match = headerValue.match(regex);
            detections.push({
              technology: tech.name,
              confidence: 85,
              version: this.extractVersion(version, match),
              source: 'header'
            });
          }
        }
      });
    });
    return detections;
  }

  analyzeScriptSrc(scripts) {
    const detections = [];
    this.technologies.forEach((tech) => {
      if (!tech.scriptSrc) return;
      const patterns = Array.isArray(tech.scriptSrc) ? tech.scriptSrc : [tech.scriptSrc];
      patterns.forEach((pattern) => {
        const { regex, version } = this.parsePattern(pattern);
        scripts.forEach((scriptSrc) => {
          if (regex.test(scriptSrc)) {
            const match = scriptSrc.match(regex);
            detections.push({
              technology: tech.name,
              confidence: 90,
              version: this.extractVersion(version, match),
              source: 'scriptSrc'
            });
          }
        });
      });
    });
    return detections;
  }

  resolveImplies(detections) {
    let done = false;
    while (!done) {
      done = true;
      const existing = detections.map(d => d.technology);
      detections.forEach((detection) => {
        const tech = this.technologies.find(t => t.name === detection.technology);
        if (tech && tech.implies) {
          const implies = Array.isArray(tech.implies) ? tech.implies : [tech.implies];
          implies.forEach((impliedName) => {
            if (!existing.includes(impliedName)) {
              detections.push({
                technology: impliedName,
                confidence: Math.min(detection.confidence, 80),
                version: '',
                source: 'implies'
              });
              done = false;
            }
          });
        }
      });
    }
  }

  resolveExcludes(detections) {
    this.technologies.forEach((tech) => {
      if (tech.excludes && detections.some(d => d.technology === tech.name)) {
        const excludes = Array.isArray(tech.excludes) ? tech.excludes : [tech.excludes];
        excludes.forEach((excludedName) => {
          const index = detections.findIndex(d => d.technology === excludedName);
          if (index !== -1) {
            detections.splice(index, 1);
          }
        });
      }
    });
  }

  mergeDetections(detections) {
    const merged = {};
    detections.forEach((detection) => {
      const key = detection.technology;
      if (!merged[key]) {
        merged[key] = {
          technology: detection.technology,
          confidence: 0,
          version: '',
          sources: []
        };
      }
      merged[key].confidence = Math.min(100, merged[key].confidence + detection.confidence);
      if (detection.version && detection.version.length > merged[key].version.length) {
        merged[key].version = detection.version;
      }
      merged[key].sources.push(detection.source);
    });
    return Object.values(merged).sort((a, b) => b.confidence - a.confidence);
  }

  parsePattern(pattern) {
    let regex = pattern;
    let version = '';
    let confidence = 100;

    if (typeof pattern === 'string') {
      const versionMatch = pattern.match(/\\;version:(.+)$/);
      if (versionMatch) {
        version = versionMatch[1];
        regex = pattern.replace(/\\;version:.+$/, '');
      }

      const confidenceMatch = pattern.match(/\\;confidence:(\d+)/);
      if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
        regex = regex.replace(/\\;confidence:\d+/, '');
      }

      regex = new RegExp(regex, 'i');
    }

    return { regex, version, confidence };
  }

  extractVersion(versionPattern, match) {
    if (!versionPattern || !match) return '';
    let version = versionPattern;
    for (let i = 1; i < match.length; i++) {
      version = version.replace(new RegExp(`\\\\${i}`, 'g'), match[i] || '');
    }
    return version.trim();
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop];
    }, obj);
  }
}
```

---

## 5. Background Worker (js/background.js) - Setup Template

```javascript
importScripts(chrome.runtime.getURL('js/detector.js'));

let allTechnologies = [];
const detectionCache = {};

chrome.runtime.onInstalled.addListener(async () => {
  await loadAllTechnologies();
});

async function loadAllTechnologies() {
  try {
    let technologies = {};
    for (let i = 0; i < 27; i++) {
      const char = i === 0 ? '_' : String.fromCharCode(96 + i);
      const tech = await fetch(chrome.runtime.getURL(`technologies/${char}.json`))
        .then(r => r.json());
      technologies = { ...technologies, ...tech };
    }
    allTechnologies = Object.entries(technologies).map(([name, data]) => ({
      name,
      ...data
    }));
  } catch (error) {
    console.error('Failed to load technologies:', error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_PAGE') {
    analyzePageData(message.data, sender.tab.id)
      .then(results => {
        sendResponse({ success: true, results });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'GET_CACHED_RESULTS') {
    const cached = detectionCache[sender.tab.id];
    sendResponse(cached || {});
  }
});

async function analyzePageData(pageData, tabId) {
  const detector = new Detector(allTechnologies);
  const results = detector.detect(pageData);
  
  const cached = {
    detections: results,
    lastAnalyzed: new Date().toISOString(),
    url: pageData.url
  };

  detectionCache[tabId] = cached;

  const domain = new URL(pageData.url).hostname;
  await chrome.storage.local.set({
    [`domain_${domain}`]: {
      detections: results,
      timestamp: Date.now(),
      url: pageData.url
    }
  });

  return results;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectionCache[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const cached = detectionCache[tabId];
    if (cached && cached.detections.length > 0) {
      chrome.action.setBadgeText({
        text: String(cached.detections.length),
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({ color: '#5B3AA0' });
    }
  }
});
```

---

## 6. Quick Regex Pattern Reference

```javascript
// Version patterns (copy-paste ready)
"^([\\d.]+)$\\;version:\\1"              // Exact version
"v([\\d.]+)"                              // With "v" prefix
"([\\d]+)\\.([\\d]+)\\.([\\d]+)"         // Major.minor.patch
"\\d{1,2}\\.\\d{1,2}"                    // Two-part version

// Common URL patterns
"jquery.*\\.js"                           // jQuery files
"react\\..*\\.js"                         // React files
"angular\\.min\\.js"                      // Angular
"wp-content/.*\\.js"                      // WordPress
"cdn\\.jsdelivr\\.net"                    // jsDelivr CDN

// HTML content patterns
"<meta name=\"generator\" content=\""     // Meta generators
"Powered by"                              // Powered by tags
"<!-- "                                   // Comments
"<script"                                 // Script tags
```

---

These patterns are exactly what Wappalyzer uses. Copy them directly into your extension!
