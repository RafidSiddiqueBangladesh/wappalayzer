# Build Prompt: Web Intelligence & Competitor Analysis Chrome Extension

## Project Overview
Build a Chrome extension that detects technologies, AI tools, and provides competitive intelligence by analyzing websites and their competitors.

---

## Core Features

### 1. **Technology Detection** (Like Wappalyzer)
- Detect CMS, frameworks, hosting, analytics platforms
- Identify server technologies
- Detect JavaScript libraries and frameworks
- Identify CDN and third-party services

### 2. **AI Tool Detection** (Enhanced Feature)
Detect which AI services are being used:
- **LLM Providers**: OpenAI, Claude, Gemini, Llama, etc.
- **AI Features**: Chatbots, recommendation engines, content generation
- **ML Services**: TensorFlow, PyTorch implementations
- **Detection Methods**:
  - API endpoint patterns (e.g., `/api/chat`, `/ai/generate`)
  - JavaScript variable signatures
  - Network requests to AI service providers
  - HTML data attributes (e.g., `data-ai-provider`)
  - Meta tags and configuration scripts
  - Response headers indicating AI services

### 3. **Company/Domain Intelligence**
- Company name and description
- Industry classification
- Founding year and company size
- Social media links
- Contact information (if public)
- Website technology stack
- SSL/TLS certificate details

### 4. **Competitor Analysis**
**Single Website Analysis**:
- Full technology stack
- AI tools in use
- Infrastructure details
- Performance metrics

**Competitor Comparison**:
- Input: competitor website URL
- Output:
  - Side-by-side technology comparison
  - AI tools comparison
  - Infrastructure differences
  - Strengths/gaps analysis
  - Common tech stack
  - Unique technologies per competitor

---

## Architecture

### File Structure
```
extension/
├── manifest.json              # Chrome extension config (v3)
├── html/
│   ├── popup.html            # Main popup UI
│   ├── options.html          # Settings & API keys
│   └── competitor.html       # Competitor analysis view
├── js/
│   ├── background.js         # Service worker
│   ├── content.js            # Page analysis script
│   ├── popup.js              # Popup logic
│   ├── competitor.js         # Competitor analysis logic
│   ├── detector.js           # Core detection engine
│   ├── ai-detector.js        # AI-specific detection
│   ├── api-client.js         # External API calls
│   └── utils.js              # Utilities
├── css/
│   └── styles.css            # Styling
├── technologies/             # Detection patterns (like Wappalyzer)
│   ├── frameworks.json
│   ├── cms.json
│   ├── hosting.json
│   ├── analytics.json
│   ├── ai-tools.json         # NEW: AI service patterns
│   └── ...
└── images/
    └── icons/
```

---

## How Wappalyzer Actually Works (Exact Methodology)

### **Detection Lifecycle**

#### **Phase 1: Initialization (Background Service Worker)**
```javascript
// Step 1: Load all technology patterns from JSON files
await loadTechnologies()
// - Fetches categories.json (defines tech categories)
// - Fetches 27 JSON files: _a.json to z.json
// - Each file has 100-500+ technology definitions
// - Example: a.json has "A-Frame", "A2Z Events", "A8.net", etc.

// Step 2: Store in memory as Wappalyzer.technologies array
// Step 3: Keep in chrome.storage.local for offline use
```

#### **Phase 2: Content Script Injection (When Page Loads)**
```javascript
// 1. Content script runs on EVERY page (http://*/* + https://*/*)
// 2. Injects code into page context to access window object
// 3. Starts collecting data from multiple sources:

// Source 1: HTML DOM Analysis
// - Scan all elements with document.querySelectorAll()
// - Look for: selectors, text content, attributes, properties
// - Match against patterns like:
//   - selector: "link[href*='wordpress']"
//   - text: "Powered by WordPress"
//   - attribute: "data-framework='react'"

// Source 2: JavaScript Variables
// - Inject script into page to read window object
// - Check for: window.jQuery, window.React, window._gat
// - Match variable names and values

// Source 3: Response Headers
// - X-Powered-By: "PHP/7.4"
// - Server: "Apache"

// Source 4: Meta Tags
// - <meta name="generator" content="WordPress 5.8">

// Source 5: Script Sources
// - Match script[src] URLs against patterns
// - Example: //cdn.jsdelivr.net/npm/jquery@3.6.0
```

#### **Phase 3: Pattern Matching (Wappalyzer Engine)**
```javascript
// Each technology has multiple detection patterns:
// Pattern Types:
//   1. scriptSrc - URL patterns in <script src="...">
//   2. js - JavaScript global variables
//   3. dom - CSS selectors for DOM elements
//   4. html - regex patterns in page HTML
//   5. headers - HTTP response headers
//   6. meta - <meta> tag content
//   7. cookies - Cookie names/values

// Pattern Format:
{
  "React": {
    "js": {
      "React.version": "^(.+)$\\;version:\\1"    // Extract version
    },
    "dom": "div[data-reactroot], div[data-react-root]",
    "scriptSrc": "react(?:\\.development|\\.production\\.min)?\\.js"
  }
}

// Matching Algorithm:
// 1. Apply regex patterns to collected data
// 2. Calculate confidence (0-100%)
// 3. Extract version if regex has capture groups (\\1, \\2)
// 4. Use ternary operator for conditional extraction: "\\1?version1:version2"
```

#### **Phase 4: Technology Resolution**
```javascript
// Step 1: Combine all detections
// Multiple patterns can match same tech (confidence stacks)
const allDetections = [
  { tech: "jQuery", confidence: 75, version: "3.6.0" },
  { tech: "jQuery", confidence: 60 } // Same tech, different pattern
]
// Result: Combined confidence = Math.min(100, 75 + 60) = 100%

// Step 2: Resolve Implies (dependencies)
// If WordPress detected → automatically add: PHP, MySQL
// If jQuery detected → automatically add: JavaScript
Wappalyzer.resolveImplies(detections)

// Step 3: Resolve Excludes (remove contradictions)
// If Framework A detected → remove Framework B
Wappalyzer.resolveExcludes(detections)

// Step 4: Sort by priority
// Categories have priority levels:
// - CMS (high priority)
// - Framework (medium)
// - Library (low)
```

#### **Phase 5: Cache & Report**
```javascript
// Store in chrome.storage.local:
{
  "hostname": {
    "detections": [...],
    "timestamp": 1704067200000,
    "ttl": 172800000  // 48 hours
  }
}

// Send to popup UI via chrome.runtime.sendMessage()
// Display in popup with icons, versions, links
```

---

## Exact Data Wappalyzer Targets

### **Data Collection Points (What Gets Analyzed)**

```javascript
// 1. HTML Source Code
// - Entire page HTML (with limits to prevent memory issues)
// - Look for: meta tags, comments, inline scripts
const html = document.documentElement.outerHTML;

// 2. DOM Elements (via querySelectorAll)
// - Specific selectors like: img[src*='logo'], link[rel='stylesheet']
// - Extract: src, href, text content, attributes
const elements = document.querySelectorAll('meta, script, link, img');

// 3. JavaScript Global Variables
// - window.jQuery, window.React, window.Vue
// - window.gtag (Google Analytics)
// - window.FB (Facebook SDK)
const jsVars = {
  jQuery: window.jQuery?.fn?.jquery,
  React: window.React?.version,
  Vue: window.Vue?.version
};

// 4. HTTP Response Headers
// - X-Powered-By, Server, X-AspNet-Version
// - Accessed via chrome.webRequest API
headers = {
  'Server': 'Apache/2.4.41',
  'X-Powered-By': 'PHP/7.4.3'
};

// 5. Cookies
// - session_id, wp_logged_in, etc.
// - Indicate technology in use
cookies = await chrome.cookies.getAll({url: tabUrl});

// 6. Response Body (First 100KB only)
// - Reduced to avoid memory issues
// - Search for: powered by tags, versions
```

### **Data Domains (What Wappalyzer Monitors)**

| Domain | What Gets Checked | Example Patterns |
|--------|------------------|------------------|
| **HTML Meta Tags** | `<meta name="generator">` | WordPress, Shopify |
| **Script Tags** | `<script src="...">` | React, Angular, Vue.js |
| **Link Tags** | `<link rel="stylesheet">` | CSS frameworks |
| **Favicons** | Icon URLs match CMS/platform | WordPress icon |
| **Comments** | HTML comments embed versions | `<!-- Powered by Joomla -->` |
| **HTTP Headers** | Server, X-Powered-By | Apache, IIS, Nginx |
| **JavaScript API** | window.* globals | jQuery, Vue, React |
| **Cookies** | Cookie names/domains | Shopify, Drupal |
| **Inline Scripts** | Direct script code analysis | Framework initialization |
| **Form Fields** | Hidden inputs with platform info | Drupal, TYPO3 |

### **Technology Categories (27 files: _a-z.json)**

Each technology file has ~300-500 entries:

```json
{
  "WordPress": {
    "cats": [1],                          // Category ID
    "description": "WordPress is a...",
    "icon": "WordPress.svg",
    "website": "https://wordpress.org",
    "pricing": ["free"],
    "js": {
      "wp": "",                           // window.wp variable
      "wpApiSettings": ""
    },
    "dom": [
      "link[rel='https://api.w.org/']",  // WordPress API link
      "meta[name='generator'][content*='WordPress']"
    ],
    "html": [
      "<link[^>]+?wp-content",            // URL patterns
      "<link[^>]+?wp-includes"
    ],
    "headers": {
      "X-Powered-By": "WordPress"         // HTTP header
    },
    "scriptSrc": [
      "wp-content/.*\\.js",
      "wp-includes/.*\\.js"
    ],
    "implies": ["PHP", "MySQL"],           // What it implies
    "excludes": ["Joomla", "Drupal"]      // Contradictions
  }
}
```

---

## Core Implementation Details

### 1. **manifest.json** (MV3 - Chrome Manifest v3)
```json
{
  "manifest_version": 3,
  "name": "Web Intelligence - Tech & AI Detector",
  "description": "Detect technologies, AI tools, and analyze competitors",
  "version": "1.0.0",
  "permissions": ["tabs", "storage", "scripting", "cookies"],
  "host_permissions": ["http://*/*", "https://*/*"],
  "background": {
    "service_worker": "js/background.js"
  },
  "content_scripts": [
    {
      "js": ["js/content.js"],
      "matches": ["http://*/*", "https://*/*"]
    }
  ],
  "action": {
    "default_popup": "html/popup.html",
    "default_title": "Web Intelligence"
  },
  "options_page": "html/options.html"
}
```

### 2. **technologies/ai-tools.json** (Detection Patterns - Wappalyzer Style)

Using Wappalyzer's exact pattern format:

```json
{
  "OpenAI": {
    "cats": [126],
    "description": "OpenAI is an AI research lab providing API access to GPT models.",
    "icon": "OpenAI.svg",
    "website": "https://openai.com",
    "pricing": ["freemium", "poa"],
    "js": {
      "OpenAI": "",
      "ChatGPT": "",
      "openai": ""
    },
    "dom": [
      "div[data-ai-provider='openai']",
      "div[class*='openai']",
      "[data-testid='chat-input']"
    ],
    "scriptSrc": [
      "api\\.openai\\.com",
      "cdn\\.openai\\.com"
    ],
    "headers": {
      "x-openai-*": ""
    }
  },
  "Claude": {
    "cats": [126],
    "description": "Claude is an AI assistant by Anthropic.",
    "icon": "Anthropic.svg",
    "website": "https://www.anthropic.com",
    "js": {
      "Claude": "",
      "Anthropic": "",
      "anthropic": ""
    },
    "dom": [
      "iframe[src*='claude']",
      "[data-ai-provider='anthropic']"
    ],
    "headers": {
      "anthropic-*": ""
    }
  },
  "Google-Gemini": {
    "cats": [126],
    "description": "Google Gemini is Google's AI model.",
    "website": "https://gemini.google.com",
    "js": {
      "google.ai": "",
      "Gemini": ""
    },
    "scriptSrc": [
      "generativelanguage\\.googleapis\\.com",
      "ai\\.google\\.dev"
    ]
  },
  "HuggingFace": {
    "cats": [126],
    "description": "HuggingFace is an open-source ML platform.",
    "website": "https://huggingface.co",
    "js": {
      "huggingface": ""
    },
    "scriptSrc": "huggingface\\.co",
    "dom": "iframe[src*='huggingface\\.co']"
  }
}
```

### 3. **js/detector.js** (Wappalyzer-Style Detection Engine)

```javascript
// Exact pattern of how Wappalyzer detects technologies

class Detector {
  constructor(technologies) {
    this.technologies = technologies;
    this.detections = [];
  }

  // Main detection method - scans all data sources
  detect(pageData) {
    const detections = [];

    // 1. Scan HTML for patterns
    detections.push(...this.analyzeHTML(pageData.html));

    // 2. Scan DOM elements
    detections.push(...this.analyzeDOM(pageData.dom));

    // 3. Scan JavaScript variables
    detections.push(...this.analyzeJS(pageData.js));

    // 4. Scan HTTP headers
    detections.push(...this.analyzeHeaders(pageData.headers));

    // 5. Scan script sources
    detections.push(...this.analyzeScriptSrc(pageData.scripts));

    // 6. Resolve dependencies (implies/excludes)
    this.resolveImplies(detections);
    this.resolveExcludes(detections);

    return this.mergeDetections(detections);
  }

  // Wappalyzer Method 1: Analyze HTML source
  analyzeHTML(html) {
    const detections = [];

    this.technologies.forEach((tech) => {
      if (!tech.html) return;

      const patterns = Array.isArray(tech.html) ? tech.html : [tech.html];

      patterns.forEach((pattern) => {
        // Convert Wappalyzer pattern format to regex
        const { regex, version, confidence } = this.parsePattern(pattern);

        if (regex.test(html)) {
          const match = html.match(regex);
          const extractedVersion = this.extractVersion(version, match);

          detections.push({
            technology: tech.name,
            confidence: confidence || 100,
            version: extractedVersion,
            source: 'html'
          });
        }
      });
    });

    return detections;
  }

  // Wappalyzer Method 2: Analyze DOM elements (CSS selectors)
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
              source: 'dom',
              selector: selector
            });
          }
        } catch (e) {
          // Invalid selector, skip
        }
      });
    });

    return detections;
  }

  // Wappalyzer Method 3: Analyze JavaScript globals
  analyzeJS(jsVariables) {
    const detections = [];

    this.technologies.forEach((tech) => {
      if (!tech.js) return;

      Object.keys(tech.js).forEach((variable) => {
        // Navigate nested paths like "window.React.version"
        const value = this.getNestedProperty(window, variable);

        if (value !== undefined) {
          const pattern = tech.js[variable];
          const { version, confidence } = this.parsePattern(pattern);

          detections.push({
            technology: tech.name,
            confidence: confidence || 90,
            version: version || (typeof value === 'string' ? value : ''),
            source: 'js',
            variable: variable
          });
        }
      });
    });

    return detections;
  }

  // Wappalyzer Method 4: Analyze HTTP headers
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
            const extractedVersion = this.extractVersion(version, match);

            detections.push({
              technology: tech.name,
              confidence: 85,
              version: extractedVersion,
              source: 'header',
              header: headerName
            });
          }
        }
      });
    });

    return detections;
  }

  // Wappalyzer Method 5: Analyze script sources
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
            const extractedVersion = this.extractVersion(version, match);

            detections.push({
              technology: tech.name,
              confidence: 90,
              version: extractedVersion,
              source: 'scriptSrc',
              script: scriptSrc
            });
          }
        });
      });
    });

    return detections;
  }

  // Wappalyzer: Resolve Implies (dependencies)
  // If WordPress found → also add PHP, MySQL
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
                source: 'implies',
                impliedBy: detection.technology
              });

              done = false;
            }
          });
        }
      });
    }
  }

  // Wappalyzer: Resolve Excludes (contradictions)
  // If Framework A found → remove Framework B
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

  // Merge multiple detections of same technology
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

      // Stack confidence (max 100)
      merged[key].confidence = Math.min(100, merged[key].confidence + detection.confidence);

      // Use longer version string
      if (detection.version && detection.version.length > merged[key].version.length) {
        merged[key].version = detection.version;
      }

      // Track all sources
      merged[key].sources.push(detection.source);
    });

    return Object.values(merged).sort((a, b) => b.confidence - a.confidence);
  }

  // Parse Wappalyzer pattern format: "pattern\\;version:\\1"
  parsePattern(pattern) {
    let regex = pattern;
    let version = '';
    let confidence = 100;

    if (typeof pattern === 'string') {
      // Extract version: "pattern\\;version:\\1"
      const versionMatch = pattern.match(/\\;version:(.+)$/);
      if (versionMatch) {
        version = versionMatch[1];
        regex = pattern.replace(/\\;version:.+$/, '');
      }

      // Extract confidence: "pattern\\;confidence:XX"
      const confidenceMatch = pattern.match(/\\;confidence:(\d+)/);
      if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
        regex = regex.replace(/\\;confidence:\d+/, '');
      }

      // Convert to regex (handle flags)
      const match = regex.match(/^(.+?)\\;(.*)$/);
      if (match) {
        regex = new RegExp(match[1], match[2] || 'i');
      } else {
        regex = new RegExp(regex, 'i');
      }
    }

    return { regex, version, confidence };
  }

  // Extract version from regex capture groups
  extractVersion(versionPattern, match) {
    if (!versionPattern || !match) return '';

    let version = versionPattern;

    // Replace backreferences: \\1 = match[1], \\2 = match[2]
    for (let i = 1; i < match.length; i++) {
      version = version.replace(new RegExp(`\\\\${i}`, 'g'), match[i] || '');
    }

    // Handle ternary: \\1?v1:v2
    const ternaryMatch = version.match(/(.+?)\\?(.+?):(.+?)$/);
    if (ternaryMatch) {
      const value = match[1];
      version = value ? ternaryMatch[2] : ternaryMatch[3];
    }

    return version.trim();
  }

  // Navigate nested properties: "window.React.version" → window.React.version
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop];
    }, obj);
  }
}
```



### 4. **js/content.js** (Data Collection - Wappalyzer Method)

```javascript
// This runs on EVERY page and collects all detection data

class ContentScriptCollector {
  async collectAllData() {
    // Wappalyzer collects data from 6 sources simultaneously
    
    const pageData = {
      url: document.location.href,
      html: document.documentElement.innerHTML.slice(0, 100000), // First 100KB only
      dom: this.analyzeDOMElements(),
      js: this.analyzeJavaScriptGlobals(),
      headers: {}, // Set by background worker from Tab API
      scripts: this.getScriptSources(),
      cookies: await this.getCookieData()
    };

    return pageData;
  }

  // Source 1: Analyze DOM Elements (CSS selectors)
  analyzeDOMElements() {
    const elements = {};

    // Get all meta tags
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        elements[`meta[name='${name}']`] = content;
      }
    });

    // Get important links
    document.querySelectorAll('link[rel]').forEach(link => {
      const href = link.getAttribute('href');
      const rel = link.getAttribute('rel');
      if (href) {
        elements[`link[rel='${rel}']`] = href;
      }
    });

    // Check for specific technology indicators
    // WordPress indicators
    if (document.querySelector('link[rel="https://api.w.org/"]')) {
      elements['wordpress_api_link'] = true;
    }

    // Check for generator meta tag
    const generator = document.querySelector('meta[name="generator"]');
    if (generator) {
      elements['generator'] = generator.getAttribute('content');
    }

    return elements;
  }

  // Source 2: Analyze JavaScript Global Variables
  analyzeJavaScriptGlobals() {
    const jsGlobals = {};

    // Common variables to check
    const varsToCheck = [
      'jQuery', 'React', 'Vue', 'Angular', 'Ember', 'Backbone',
      'gtag', '_gat', '_gaq', 'ga', // Google Analytics
      'FB', // Facebook
      'twttr', // Twitter
      'linkedIn', // LinkedIn
      'Shopify', // Shopify
      'wp', 'wpApiSettings', // WordPress
      'drupalSettings', // Drupal
      'joomla', // Joomla
      'OpenAI', 'Claude', 'anthropic', // AI tools
      'google', '_stripe', '_gumroad'
    ];

    varsToCheck.forEach(varName => {
      try {
        const value = eval(`typeof window.${varName} !== 'undefined' ? window.${varName} : undefined`);
        if (value !== undefined) {
          // Try to get version
          const version = value?.version || value?.VERSION || value?._version || '';
          jsGlobals[varName] = version || true;
        }
      } catch (e) {
        // Skip if can't access
      }
    });

    return jsGlobals;
  }

  // Source 3: Get Script Sources
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

  // Source 4: Get Cookie Data
  async getCookieData() {
    try {
      const cookies = await chrome.cookies.getAll({ url: document.location.href });
      const cookieObj = {};

      cookies.forEach(cookie => {
        cookieObj[cookie.name] = cookie.value.slice(0, 100); // First 100 chars
      });

      return cookieObj;
    } catch (e) {
      return {};
    }
  }

  // Source 5: Monitor Network Requests (via fetch interception)
  setupNetworkMonitoring() {
    const self = this;
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
      const url = args[0];
      
      // Log API calls for detection
      chrome.runtime.sendMessage({
        type: 'NETWORK_REQUEST',
        url: url,
        timestamp: Date.now()
      }).catch(() => {}); // Ignore if no listener

      return originalFetch.apply(this, args);
    };

    // Also monitor XMLHttpRequest
    const XHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      chrome.runtime.sendMessage({
        type: 'XHR_REQUEST',
        method: method,
        url: url,
        timestamp: Date.now()
      }).catch(() => {});

      return XHROpen.apply(this, arguments);
    };
  }
}

// Initialize and send data to background
const collector = new ContentScriptCollector();

(async () => {
  try {
    const pageData = await collector.collectAllData();
    
    // Send to background worker for analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PAGE',
      data: pageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      }
    });

    // Also setup network monitoring for AI tools
    collector.setupNetworkMonitoring();
  } catch (error) {
    console.error('Content script error:', error);
  }
})();
```

### 5. **js/background.js** (Service Worker - Orchestration)

```javascript
// Service Worker: Runs continuously in background
// Receives data from content scripts, runs detector, caches results

importScripts(chrome.runtime.getURL('js/detector.js'));

// Store all technologies in memory
let allTechnologies = [];
const detectionCache = {}; // Cache results per domain

// Step 1: Load all technology patterns on startup
chrome.runtime.onInstalled.addListener(async () => {
  await loadAllTechnologies();
});

async function loadAllTechnologies() {
  try {
    // Wappalyzer loads 27 JSON files: categories.json + _a.json to z.json
    const categories = await fetch(chrome.runtime.getURL('categories.json'))
      .then(r => r.json());

    let technologies = {};

    // Load _a.json through z.json (27 files total)
    for (let i = 0; i < 27; i++) {
      const char = i === 0 ? '_' : String.fromCharCode(96 + i); // _, a, b, ..., z
      const tech = await fetch(chrome.runtime.getURL(`technologies/${char}.json`))
        .then(r => r.json());

      technologies = { ...technologies, ...tech };
    }

    allTechnologies = Object.entries(technologies).map(([name, data]) => ({
      name,
      ...data
    }));

    // Store in local storage for offline use
    await chrome.storage.local.set({ allTechnologies, categories });
  } catch (error) {
    console.error('Failed to load technologies:', error);
  }
}

// Step 2: Listen for data from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_PAGE') {
    // Content script sent page data
    analyzePageData(message.data, sender.tab.id)
      .then(results => {
        sendResponse({ success: true, results });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_CACHED_RESULTS') {
    // Popup asking for cached results
    const cached = detectionCache[sender.tab.id];
    sendResponse(cached || {});
  }

  if (message.type === 'NETWORK_REQUEST' || message.type === 'XHR_REQUEST') {
    // Track API calls for AI detection
    trackNetworkRequest(message.url, sender.tab.id);
  }
});

// Step 3: Run detector and cache results
async function analyzePageData(pageData, tabId) {
  // Get current cached results if any
  let cached = detectionCache[tabId] || {
    detections: [],
    lastAnalyzed: null
  };

  // Instantiate detector with all technologies
  const detector = new Detector(allTechnologies);

  // Run detection
  const results = detector.detect(pageData);

  // Cache the results
  cached.detections = results;
  cached.lastAnalyzed = new Date().toISOString();
  cached.url = pageData.url;

  detectionCache[tabId] = cached;

  // Also store in chrome.storage.local (persist across extension restarts)
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

// Step 4: Track network requests for AI detection
const networkLog = {};

function trackNetworkRequest(url, tabId) {
  if (!networkLog[tabId]) {
    networkLog[tabId] = [];
  }

  // Check if URL is AI-related
  const aiDomains = [
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'api.huggingface.co',
    'localhost:11434'
  ];

  const isAI = aiDomains.some(domain => url.includes(domain));

  if (isAI) {
    networkLog[tabId].push({
      url,
      timestamp: Date.now(),
      aiProvider: identifyAIProvider(url)
    });
  }
}

function identifyAIProvider(url) {
  if (url.includes('openai')) return 'OpenAI';
  if (url.includes('anthropic')) return 'Claude';
  if (url.includes('generativelanguage')) return 'Google Gemini';
  if (url.includes('huggingface')) return 'HuggingFace';
  if (url.includes('localhost:11434')) return 'Local LLM';
  return 'Unknown';
}

// Step 5: Clean up cache when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectionCache[tabId];
  delete networkLog[tabId];
});

// Step 6: Update extension badge with count of technologies found
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

### 6. **js/competitor.js** (Competitor Analysis)
```javascript
class CompetitorAnalyzer {
  constructor() {
    this.competitors = [];
  }

  // Analyze a competitor URL
  async analyzeCompetitor(competitorUrl) {
    try {
      const response = await fetch(competitorUrl);
      const html = await response.text();
      
      // Extract technologies
      const technologies = await this.extractTechnologies(html);
      
      // Extract AI tools
      const aiTools = await this.detectAI(html);
      
      // Get domain info via external API
      const domainInfo = await this.getDomainInfo(competitorUrl);
      
      return {
        url: competitorUrl,
        technologies,
        aiTools,
        domainInfo,
        scannedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Competitor analysis failed:', error);
      return null;
    }
  }

  // Compare multiple competitors
  async compareCompetitors(currentSiteData, competitorUrls) {
    const competitorData = [];
    
    for (const url of competitorUrls) {
      const data = await this.analyzeCompetitor(url);
      if (data) competitorData.push(data);
    }

    return this.generateComparison(currentSiteData, competitorData);
  }

  generateComparison(currentSite, competitors) {
    return {
      current: currentSite,
      competitors: competitors,
      analysis: {
        commonTechnologies: this.findCommon(currentSite, competitors),
        uniqueToYou: this.findUnique(currentSite, competitors),
        competitorAdvantages: this.findGaps(currentSite, competitors),
        aiUsage: this.compareAIUsage(currentSite, competitors)
      }
    };
  }

  findCommon(current, competitors) {
    // Find technologies used by all
  }

  findUnique(current, competitors) {
    // Find what only current site uses
  }

  findGaps(current, competitors) {
    // Find what competitors use but current doesn't
  }

  compareAIUsage(current, competitors) {
    // Compare AI tool usage
  }
}
```

### 7. **html/popup.html** (Enhanced UI)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Web Intelligence</title>
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <div class="popup">
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab active" data-tab="current">Current Site</button>
      <button class="tab" data-tab="competitors">Competitors</button>
      <button class="tab" data-tab="settings">Settings</button>
    </div>

    <!-- Current Site Analysis -->
    <div id="current" class="tab-content active">
      <div class="site-header">
        <h2 id="siteName"></h2>
        <p id="siteUrl"></p>
      </div>

      <section class="section">
        <h3>Technologies Detected</h3>
        <div id="technologies-list"></div>
      </section>

      <section class="section">
        <h3>AI Tools Detected</h3>
        <div id="ai-tools-list"></div>
      </section>

      <section class="section">
        <h3>Company Info</h3>
        <div id="company-info"></div>
      </section>

      <!-- Competitor Analysis Button -->
      <button id="add-competitor-btn" class="btn btn-primary">
        + Analyze Competitor
      </button>
    </div>

    <!-- Competitors Analysis -->
    <div id="competitors" class="tab-content">
      <div id="competitors-list"></div>

      <div class="competitor-input">
        <input 
          type="url" 
          id="competitor-url" 
          placeholder="Enter competitor URL"
          class="input"
        >
        <button id="add-competitor-submit" class="btn btn-primary">Add</button>
      </div>

      <div id="comparison-results"></div>
    </div>

    <!-- Settings -->
    <div id="settings" class="tab-content">
      <label>
        API Key (Optional - for enhanced data):
        <input type="password" id="apiKey" class="input">
      </label>
      <button id="save-settings" class="btn">Save</button>
    </div>
  </div>

  <script src="../js/utils.js"></script>
  <script src="../js/popup.js"></script>
  <script src="../js/competitor.js"></script>
</body>
</html>
```

---

## Detection Methods

### **Network Interception**
```javascript
// Monitor XMLHttpRequest/Fetch for AI endpoints
// Detect: API calls to OpenAI, Claude, Gemini, etc.
```

### **DOM Analysis**
```javascript
// Scan HTML for:
// - Specific IDs/classes (e.g., #chatbot, .ai-powered)
// - Data attributes
// - Script tags with AI library sources
```

### **JavaScript Variable Analysis**
```javascript
// Check window object for AI library instances
// Detect global variables indicating AI usage
```

### **Meta Tags & Headers**
```javascript
// Parse <meta> tags
// Check HTTP headers for API signatures
```

### **CSS Analysis**
```javascript
// Detect UI patterns common to AI tools
// Find animation/styling specific to chatbots
```

---

## Data Flow

### Single Site Analysis
```
1. User visits website
2. Content script injects detector
3. Detector analyzes:
   - DOM structure
   - JavaScript execution
   - Network requests
   - CSS and styles
4. Results sent to background service worker
5. Cached in local storage
6. Popup displays findings
```

### Competitor Analysis
```
1. User enters competitor URL
2. Background worker fetches competitor page
3. Same analysis pipeline runs
4. Results compared with current site
5. Comparison report generated
6. Display side-by-side analysis
```

---

## Key Technologies to Detect

### **Frameworks**
- React, Vue, Angular, Svelte, Next.js, Nuxt

### **CMS**
- WordPress, Drupal, Shopify, Magento

### **Hosting**
- AWS, Google Cloud, Azure, Heroku, Vercel

### **Analytics**
- Google Analytics, Mixpanel, Segment, Amplitude

### **AI Tools** ⭐ (NEW)
- OpenAI (ChatGPT, GPT-4)
- Anthropic (Claude)
- Google (Gemini)
- HuggingFace
- Local LLMs (Ollama, LLaMA)
- Midjourney, Stable Diffusion

### **Other**
- Payment gateways (Stripe, PayPal)
- CDN services
- Security tools

---

## API Integration

### External Data Sources
```javascript
// Get company/domain intelligence
const response = await fetch(`https://api.YOUR_SERVICE.com/domain/${domain}`);

// Get technology trends
const trends = await fetch(`https://api.YOUR_SERVICE.com/tech-trends`);
```

### Optional Premium APIs
- Hunter.io (email discovery)
- Clearbit (company data)
- SimilarWeb (traffic analysis)
- Apollo.io (B2B data)

---

## Implementation Roadmap

### Phase 1: MVP (Core Detection)
- ✅ Basic technology detection
- ✅ Popup UI
- ✅ Local storage caching

### Phase 2: AI Detection
- ✅ AI tool detection
- ✅ Network monitoring
- ✅ AI-specific patterns

### Phase 3: Competitor Analysis
- ✅ Single competitor analysis
- ✅ Comparison generation
- ✅ Report UI

### Phase 4: Premium Features
- ✅ API integration
- ✅ Company data enrichment
- ✅ Export reports

### Phase 5: Advanced Features
- ✅ Historical tracking
- ✅ Trend analysis
- ✅ Market research reports

---

## Key Differences from Wappalyzer

| Feature | Wappalyzer | Your Tool |
|---------|-----------|-----------|
| AI Detection | ❌ No | ✅ Yes |
| Competitor Analysis | ❌ No | ✅ Yes |
| Side-by-side Comparison | ❌ No | ✅ Yes |
| Network Monitoring | Basic | Enhanced |
| Reporting | Simple | Advanced |

---

## Security Considerations

1. **No sensitive data collection** - Only analyze public HTML/CSS
2. **User control** - Allow disabling per domain
3. **API key protection** - Store securely in chrome.storage.local
4. **No tracking** - Don't track user activity
5. **CORS compliance** - Handle CORS errors gracefully

---

## Example Output

### Current Site Analysis
```json
{
  "url": "https://example.com",
  "technologies": [
    { "name": "React", "category": "Framework" },
    { "name": "Webpack", "category": "Build tool" },
    { "name": "AWS", "category": "Hosting" }
  ],
  "aiTools": [
    { "name": "OpenAI", "type": "LLM", "confidence": 95 },
    { "name": "HuggingFace", "type": "ML Platform", "confidence": 78 }
  ],
  "company": {
    "name": "Example Inc",
    "industry": "Technology",
    "founded": 2015
  }
}
```

### Competitor Comparison
```json
{
  "comparison": {
    "commonTech": ["React", "AWS", "Google Analytics"],
    "yourAdvantage": ["Vue.js", "Custom ML"],
    "theirAdvantage": ["OpenAI GPT-4", "More AI tools"],
    "recommendations": [
      "Consider implementing OpenAI integration",
      "Competitor using more AI tools - opportunity gap"
    ]
  }
}
```

---

## Prompt for AI Code Generation

When using AI to build this, use this prompt:

```
Build a Chrome extension that:
1. Detects web technologies like Wappalyzer
2. Identifies AI tools (OpenAI, Claude, Gemini, Local LLMs)
3. Provides competitor analysis
4. Compares current site vs competitor sites side-by-side

Features needed:
- Technology detection patterns (frameworks, hosting, analytics)
- AI tool detection via network monitoring, JS variables, HTML
- Competitor URL input and analysis
- Comparison report generation
- Settings for API keys

Use Manifest V3, with content scripts, service worker, and popup.
Include detection patterns in JSON files.
```

---

## Complete Wappalyzer Execution Flow (Step-by-Step)

### **Timeline: User Visits Website**

```
TIME: 0ms - Page Load Starts
└─ Browser loads: document.html

TIME: 100ms - Content Script Injects
├─ content.js runs on http://*/* + https://*/*
├─ Creates ContentScriptCollector instance
└─ Starts collecting data

TIME: 150ms - Data Collection Begins
├─ collectAllData() gathers from 6 sources:
│  ├── HTML Source (first 100KB only)
│  ├── DOM Elements (via querySelectorAll)
│  ├── JavaScript Globals (window.*)
│  ├── Script Sources (<script src="...">)
│  ├── Cookies (via chrome.cookies API)
│  └── HTTP Headers (from service worker)

TIME: 200ms - Data Sent to Background
├─ chrome.runtime.sendMessage({
│    type: 'ANALYZE_PAGE',
│    data: pageData
│  })
└─ Establishes async communication channel

TIME: 250ms - Background Service Worker Processes
├─ detector.js Detector class instantiated
├─ detector.detect(pageData) called
├─ Runs 5 parallel analysis methods:
│  ├── analyzeHTML() - regex match on HTML source
│  ├── analyzeDOM() - querySelectorAll on page
│  ├── analyzeJS() - check window.* variables
│  ├── analyzeHeaders() - match HTTP headers
│  └── analyzeScriptSrc() - match <script> tags

TIME: 300ms - Pattern Matching
├─ For each technology in allTechnologies array:
│  ├─ Load pattern definitions (js, dom, html, etc)
│  ├─ Convert patterns to regex objects
│  ├─ Test against collected data
│  └─ If match: calculate confidence + extract version
│
├─ Confidence Stacking Example:
│  └─ jQuery found in:
│     ├─ window.jQuery (90% confidence)
│     ├─ <script src="jquery.js"> (85% confidence)
│     └─ Total: Math.min(100, 90+85) = 100% confidence

TIME: 350ms - Resolve Dependencies
├─ resolveImplies():
│  └─ WordPress found → automatically add PHP, MySQL, Apache
│
├─ resolveExcludes():
│  └─ Framework A detected → remove contradicting Framework B
│
└─ mergeDetections(): Consolidate duplicate technologies

TIME: 400ms - Cache Results
├─ Store in detectionCache[tabId]:
│  ├─ detections: [ ... results ... ]
│  ├─ lastAnalyzed: timestamp
│  └─ url: website URL
│
├─ Also persist to chrome.storage.local:
│  └─ domain_example.com:
│     ├─ detections: [ ... ]
│     └─ timestamp: 1704067200000

TIME: 450ms - Update UI
├─ chrome.action.setBadgeText(count)
└─ Popup ready to display results

TIME: 500ms+ - User Clicks Extension Icon
├─ popup.js requests chrome.runtime.sendMessage({
│    type: 'GET_CACHED_RESULTS'
│  })
├─ Background responds with cached data
└─ popup.html displays:
   ├─ Technology names with icons
   ├─ Confidence percentages
   ├─ Version numbers
   ├─ Category labels
   └─ Links to learn more
```

### **Detailed: Pattern Matching Example**

```javascript
// Technology Definition (from technologies/w.json)
const WordPress = {
  "name": "WordPress",
  "cats": [1],
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

// Step 1: analyzeJS()
// Check: if (window.wp !== undefined) → MATCH (80% confidence)

// Step 2: analyzeDOM()
// querySelectorAll("meta[name='generator']") → found
// content = "WordPress 5.8"
// regex test: /wordpress/i → MATCH (90% confidence)

// Step 3: analyzeScriptSrc()
// script.src = "https://example.com/wp-content/uploads/script.js"
// regex: /wp-content\/.*\.js/ → MATCH (95% confidence)

// Step 4: Merge & Stack
// Total Confidence = Math.min(100, 80 + 90 + 95) = 100%
// Version = "5.8" (from meta tag content)

// Step 5: resolveImplies()
// WordPress detected → add:
//   - PHP (90% confidence)
//   - MySQL (80% confidence)
//   - Apache (75% confidence)

// FINAL RESULT:
{
  "WordPress 5.8": 100% confidence,
  "PHP": 90% confidence,
  "MySQL": 80% confidence,
  "Apache": 75% confidence
}
```

### **Network Data Flow Diagram**

```
┌─────────────────┐
│  User's Browser │
│  ┌───────────┐  │
│  │ Page HTML │  │
│  └──────┬────┘  │
└─────────┼───────┘
          │
          ├─► content.js injects ContentScriptCollector
          │
          ├─► Collects: HTML, DOM, JS, scripts, cookies
          │
          └─► Sends: chrome.runtime.sendMessage()
              │
              ▼
          ┌──────────────────┐
          │ Service Worker   │
          │ (background.js)  │
          │                  │
          │ ├─ Load all 27   │
          │ │  tech JSON     │
          │ │  files         │
          │ │                │
          │ ├─ Instantiate   │
          │ │  Detector      │
          │ │                │
          │ ├─ Run 5 parallel│
          │ │  analysis      │
          │ │                │
          │ ├─ Resolve impl/ │
          │ │  excludes      │
          │ │                │
          │ └─ Cache results │
          └────────┬─────────┘
                   │
                   │ stores in chrome.storage.local
                   │ + detectionCache[tabId]
                   │
                   ▼
          ┌──────────────────┐
          │  popup.js        │
          │                  │
          │ Requests cached  │
          │ results via      │
          │ sendMessage()    │
          │                  │
          │ Receives & renders
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  User sees:      │
          │ ✓ React 17.0     │
          │ ✓ Webpack 5.x    │
          │ ✓ AWS Hosting    │
          │ ✓ OpenAI API     │
          └──────────────────┘
```

---

## Quick Reference: Implementation Checklist

When building your tool, follow this exact sequence:

**Files to Create (in order):**

1. ✅ `manifest.json` - Extension config (MV3)
2. ✅ `technologies/*.json` - Detection patterns (27 files)
3. ✅ `js/detector.js` - Core detection engine
4. ✅ `js/content.js` - Data collection from pages
5. ✅ `js/background.js` - Service worker orchestration
6. ✅ `js/utils.js` - Helper functions
7. ✅ `html/popup.html` - Main UI
8. ✅ `js/popup.js` - Popup logic
9. ✅ `css/styles.css` - Styling

**Core Methods (Must Implement):**

1. `collectAllData()` - Gather from 6 sources
2. `analyzeHTML()` - Pattern match on HTML
3. `analyzeDOM()` - CSS selector matching
4. `analyzeJS()` - Check window globals
5. `analyzeHeaders()` - HTTP header detection
6. `analyzeScriptSrc()` - Script URL patterns
7. `resolveImplies()` - Add implied technologies
8. `resolveExcludes()` - Remove contradictions
9. `mergeDetections()` - Consolidate results

**Key Patterns (Copy-Paste Ready):**

```javascript
// Pattern 1: Detect by JavaScript variable
"js": { "jQuery": "^([\\d.]+)$\\;version:\\1" }

// Pattern 2: Detect by DOM selector
"dom": "meta[name='generator'][content*='WordPress']"

// Pattern 3: Detect by script URL
"scriptSrc": "react(?:\\.development|\\.production)?\\.js"

// Pattern 4: Detect by HTTP header
"headers": { "X-Powered-By": "PHP/([\\d.]+)\\;version:\\1" }

// Pattern 5: Detect by HTML pattern
"html": "<meta name='framework' content='Vue'"

// Pattern 6: Detect by implication
"implies": ["PHP", "MySQL", "Apache"]
```

---

## Wappalyzer Pattern Format Reference

This is the EXACT format Wappalyzer uses:

```
SYNTAX: pattern\\;flag:value\\;flag:value

Key Flags:
  version:\\1     → Extract version from regex group 1
  version:\\2     → Extract version from regex group 2
  confidence:NN   → Set custom confidence (0-100)
  
Examples:
  "^([\\d.]+)$\\;version:\\1"
    → Captures group 1 as version
  
  "jQuery"
    → Simple string match (case-insensitive)
  
  "pattern\\;confidence:90"
    → Custom confidence level
  
  "value\\?version_true:version_false"
    → Ternary operator for conditions
```

---

This prompt now contains EVERYTHING needed to build an advanced web intelligence tool that rivals Wappalyzer with AI detection and competitor analysis!
