// Content script - runs in page context to gather data

console.log('Content script loaded');

class ContentScriptCollector {
  constructor() {
    this.pageData = {
      html: '',
      scripts: [],
      jsVars: {},
      headers: {},
      cookies: {},
      meta: {},
      title: '',
      url: window.location.href
    };
  }

  // Collect all page data
  collectData() {
    try {
      this.collectHTML();
      this.collectScripts();
      this.collectJavaScript();
      this.collectMeta();
      this.collectPageInfo();
      return this.pageData;
    } catch (error) {
      console.error('Error collecting data:', error);
      return this.pageData;
    }
  }

  // Get page HTML
  collectHTML() {
    try {
      this.pageData.html = document.documentElement.outerHTML.substring(0, 100000);
    } catch (error) {
      console.error('Error collecting HTML:', error);
    }
  }

  // Get all script sources
  collectScripts() {
    try {
      const scripts = new Set();
      
      document.querySelectorAll('script[src]').forEach(script => {
        if (script.src) scripts.add(script.src);
      });
      
      document.querySelectorAll('script:not([src])').forEach(script => {
        if (script.textContent && script.textContent.trim()) {
          scripts.add(script.textContent.substring(0, 500));
        }
      });
      
      this.pageData.scripts = Array.from(scripts);
    } catch (error) {
      console.error('Error collecting scripts:', error);
    }
  }

  // Detect JavaScript variables and objects
  collectJavaScript() {
    try {
      const jsSignatures = {
        'React': typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ? 'found' : '',
        'Vue': typeof window.__VUE__ !== 'undefined' ? 'found' : '',
        'Angular': typeof window.angular !== 'undefined' ? 'found' : '',
        'jQuery': typeof window.jQuery !== 'undefined' || typeof window.$ !== 'undefined' ? 'found' : '',
        'Bootstrap': typeof window.bootstrap !== 'undefined' ? 'found' : '',
        'LangChain': typeof window.LangChain !== 'undefined' ? 'found' : '',
        'OpenAI': typeof window.openai !== 'undefined' || typeof window.ChatGPT !== 'undefined' ? 'found' : '',
      };
      
      this.pageData.jsVars = jsSignatures;
    } catch (error) {
      console.error('Error collecting JS vars:', error);
    }
  }

  // Collect meta information
  collectMeta() {
    try {
      const metaTags = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metaTags[name] = content;
        }
      });
      this.pageData.meta = metaTags;
    } catch (error) {
      console.error('Error collecting meta:', error);
    }
  }

  // Collect page info
  collectPageInfo() {
    try {
      this.pageData.title = document.title || '';
      this.pageData.url = window.location.href;
    } catch (error) {
      console.error('Error collecting page info:', error);
    }
  }
}

// Initialize collector
const collector = new ContentScriptCollector();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    console.log('Content script received message:', request.type);
    
    if (request.type === 'COLLECT_DATA') {
      // Collect and send data immediately
      const pageData = collector.collectData();
      console.log('Sending page data to background');
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'PAGE_DATA',
        data: pageData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending data:', chrome.runtime.lastError);
        } else {
          console.log('Data sent successfully');
        }
      });
      
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep channel open for async response
});

// Auto-collect and send data on page load
window.addEventListener('load', () => {
  try {
    console.log('Page loaded, collecting data...');
    const pageData = collector.collectData();
    
    chrome.runtime.sendMessage({
      type: 'PAGE_DATA',
      data: pageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not send data (might be restricted page)');
      }
    });
  } catch (error) {
    console.error('Error on page load:', error);
  }
});
