// Background Service Worker - orchestrates detection
console.log('Background service worker starting...');

let lastDetection = { technologies: [], url: '' };

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    console.log('Message received:', request.type);
    
    if (request.type === 'PAGE_DATA' && sender.tab) {
      handlePageData(request.data, sender.tab, sendResponse);
    } else if (request.type === 'GET_LAST_DETECTION') {
      getLastDetection(sendResponse);
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});

// Get last detection
function getLastDetection(sendResponse) {
  console.log('Returning last detection:', lastDetection);
  sendResponse(lastDetection || { technologies: [] });
}

// Comprehensive technology detection
function analyzePage(pageData) {
  try {
    const detectedTechs = [];
    const html = (pageData.html || '').toLowerCase();
    const scripts = (pageData.scripts || []).map(s => (s || '').toLowerCase());
    const fullHtml = pageData.html || '';
    
    // Comprehensive patterns for 30+ technologies
    const patterns = {
      // CMS
      'WordPress': {
        html: ['wp-content', 'wp-includes', 'wordpress', 'wp-json', 'wp-app'],
        scripts: ['wp-content', 'wp-includes'],
        confidence: 95
      },
      // Ecommerce
      'WooCommerce': {
        html: ['woocommerce', 'woo-product', 'wc-cart', 'cart.php'],
        scripts: ['woocommerce'],
        confidence: 90
      },
      'Shopify': {
        html: ['shopify', 'cdn.shopify', 'myshopify'],
        scripts: ['cdn.shopify.com'],
        confidence: 95
      },
      // Analytics
      'Google Analytics': {
        html: ['ga(', 'gtag(', 'google-analytics', '_ga', 'UA-'],
        scripts: ['google-analytics', 'analytics.google.com', 'gtag/js'],
        confidence: 95
      },
      'GA4': {
        html: ['gtag(', 'G-', 'measurement_id'],
        scripts: ['gtag/js'],
        confidence: 85
      },
      'Facebook Pixel': {
        html: ['fbq(', 'facebook.com/tr', 'pixel.facebook'],
        scripts: ['facebook.com/en_US/fbevents.js'],
        confidence: 90
      },
      'Google Tag Manager': {
        html: ['googletagmanager', 'gtm.js', 'gtm.start'],
        scripts: ['googletagmanager.com'],
        confidence: 95
      },
      'Site Kit': {
        html: ['site-kit', 'googlesitekit'],
        scripts: ['googlesitekit'],
        confidence: 85
      },
      'Mixpanel': {
        html: ['mixpanel'],
        scripts: ['mixpanel'],
        confidence: 85
      },
      // JavaScript Frameworks
      'React': {
        html: ['react', '__react', 'reactroot'],
        scripts: ['react', 'reactdom'],
        confidence: 90
      },
      'Vue': {
        html: ['vue', '__vue', 'v-app'],
        scripts: ['vue'],
        confidence: 90
      },
      'Angular': {
        html: ['angular', 'ng-app', 'ng-version'],
        scripts: ['angular'],
        confidence: 90
      },
      'Backbone.js': {
        html: ['backbone'],
        scripts: ['backbone'],
        confidence: 80
      },
      // JavaScript Libraries
      'jQuery': {
        html: ['jquery', 'jQuery'],
        scripts: ['jquery'],
        confidence: 95
      },
      'jQuery Migrate': {
        html: ['jqmigrate'],
        scripts: ['jquery-migrate'],
        confidence: 85
      },
      'Underscore.js': {
        html: ['underscore'],
        scripts: ['underscore'],
        confidence: 80
      },
      'Swiper': {
        html: ['swiper', 'swiper-container'],
        scripts: ['swiper'],
        confidence: 85
      },
      // CSS Frameworks
      'Bootstrap': {
        html: ['bootstrap', 'btn-primary', 'container-fluid', 'col-md'],
        scripts: ['bootstrap'],
        confidence: 85
      },
      // CDN & Hosting
      'Cloudflare': {
        html: ['cloudflare', 'cf-ray'],
        scripts: ['cloudflare'],
        confidence: 75
      },
      'Cloudways': {
        html: ['cloudways', 'platform.cloudways'],
        scripts: ['cloudways'],
        confidence: 75
      },
      // Page Builders
      'Elementor': {
        html: ['elementor', 'data-elementor', 'elementor-widget'],
        scripts: ['elementor'],
        confidence: 90
      },
      // Form Builders
      'Contact Form 7': {
        html: ['wpcf7', 'contact-form-7', 'wpcf7-form'],
        scripts: ['contact-form-7'],
        confidence: 85
      },
      // Databases
      'MySQL': {
        html: ['mysql'],
        scripts: ['mysql'],
        confidence: 70
      },
      'PHP': {
        html: ['php', 'Laravel', 'wordpress'],
        scripts: ['php'],
        confidence: 65
      },
      // Security
      'Cloudflare Bot Management': {
        html: ['cloudflare', 'bot-management'],
        scripts: ['cloudflare'],
        confidence: 70
      },
      // Miscellaneous
      'HTTP/3': {
        html: ['http/3', 'quic'],
        scripts: [],
        confidence: 60
      },
      // Themes
      'Hello Elementor': {
        html: ['hello-elementor', 'Hello Elementor'],
        scripts: [],
        confidence: 75
      },
      // Payment
      'Stripe': {
        html: ['stripe', 'stripe.com'],
        scripts: ['stripe.com'],
        confidence: 85
      },
      // AI Services
      'OpenAI': {
        html: ['openai', 'chatgpt', 'gpt', 'chat.openai'],
        scripts: ['openai', 'api.openai.com'],
        confidence: 90
      },
      'Claude': {
        html: ['claude', 'anthropic', 'claude.ai'],
        scripts: ['claude', 'anthropic'],
        confidence: 85
      },
      'Google Gemini': {
        html: ['gemini', 'bard', 'google.ai'],
        scripts: ['gemini', 'google-ai'],
        confidence: 80
      },
      'Hugging Face': {
        html: ['huggingface', 'hf_'],
        scripts: ['huggingface.co'],
        confidence: 80
      },
      // Development
      'LangChain': {
        html: ['langchain'],
        scripts: ['langchain'],
        confidence: 75
      },
      'LlamaIndex': {
        html: ['llamaindex'],
        scripts: ['llamaindex'],
        confidence: 75
      },
      // UI Frameworks
      'Tailwind CSS': {
        html: ['tailwindcss', 'tailwind', 'class=".*\\w+-(left|right|top|bottom)-'],
        scripts: ['tailwindcss', 'tailwind'],
        confidence: 85
      },
      'Radix UI': {
        html: ['radix-ui', 'radix', 'radixui'],
        scripts: ['radix-ui'],
        confidence: 80
      },
      'shadcn/ui': {
        html: ['shadcn', 'shadcn/ui'],
        scripts: ['shadcn'],
        confidence: 75
      },
      // JavaScript Libraries
      'Framer Motion': {
        html: ['framer-motion', 'framer motion'],
        scripts: ['framer-motion'],
        confidence: 80
      },
      'Lucide': {
        html: ['lucide', 'lucide-icon'],
        scripts: ['lucide'],
        confidence: 75
      },
      // Page Builders
      'Lovable': {
        html: ['lovable', 'lovable.dev'],
        scripts: ['lovable'],
        confidence: 80
      },
      // Analytics
      'Tinybird': {
        html: ['tinybird', 'api.tinybird'],
        scripts: ['tinybird'],
        confidence: 80
      },
      // Routing
      'React Router': {
        html: ['react-router', 'react router'],
        scripts: ['react-router'],
        confidence: 85
      },
      // Security
      'HSTS': {
        html: ['strict-transport-security'],
        scripts: [],
        confidence: 70
      },
      // Meta
      'Open Graph': {
        html: ['og:', 'og:title', 'og:image', 'og:description'],
        scripts: [],
        confidence: 60
      }
    };
    
    // Check each pattern
    for (const [techName, pattern] of Object.entries(patterns)) {
      let found = false;
      
      // Check HTML patterns
      if (pattern.html && pattern.html.some(p => html.includes(p.toLowerCase()))) {
        found = true;
      }
      
      // Check script patterns
      if (!found && pattern.scripts && scripts.some(script => 
        pattern.scripts.some(p => script.includes(p.toLowerCase()))
      )) {
        found = true;
      }
      
      // Additional case-sensitive checks for exact matches
      if (!found && pattern.html) {
        found = pattern.html.some(p => fullHtml.includes(p));
      }
      
      if (found) {
        detectedTechs.push({
          name: techName,
          confidence: pattern.confidence || 75,
          category: getCategoryForTech(techName)
        });
      }
    }
    
    return detectedTechs;
  } catch (error) {
    console.error('Error analyzing page:', error);
    return [];
  }
}

// Get category for technology
function getCategoryForTech(techName) {
  const categories = {
    'WordPress': 'CMS',
    'WooCommerce': 'Ecommerce',
    'Shopify': 'Ecommerce',
    'Stripe': 'Payment',
    'Google Analytics': 'Analytics',
    'GA4': 'Analytics',
    'Facebook Pixel': 'Analytics',
    'Google Tag Manager': 'Tag managers',
    'Site Kit': 'Analytics',
    'Mixpanel': 'Analytics',
    'React': 'JavaScript frameworks',
    'Vue': 'JavaScript frameworks',
    'Angular': 'JavaScript frameworks',
    'Backbone.js': 'JavaScript frameworks',
    'jQuery': 'JavaScript libraries',
    'jQuery Migrate': 'JavaScript libraries',
    'Underscore.js': 'JavaScript libraries',
    'Swiper': 'JavaScript libraries',
    'Bootstrap': 'CSS Frameworks',
    'Cloudflare': 'CDN',
    'Cloudways': 'PaaS',
    'Elementor': 'Page builder',
    'Contact Form 7': 'Form builders',
    'MySQL': 'Databases',
    'PHP': 'Programming languages',
    'Cloudflare Bot Management': 'Security',
    'HTTP/3': 'Miscellaneous',
    'Hello Elementor': 'WordPress themes',
    'OpenAI': 'AI Services',
    'Claude': 'AI Services',
    'Google Gemini': 'AI Services',
    'Hugging Face': 'AI Services',
    'LangChain': 'AI Development',
    'LlamaIndex': 'AI Development',
    'Blogs': 'CMS',
    'Tailwind CSS': 'UI frameworks',
    'Radix UI': 'UI frameworks',
    'shadcn/ui': 'UI frameworks',
    'Framer Motion': 'JavaScript libraries',
    'Lucide': 'Font scripts',
    'Lovable': 'Page builder',
    'Tinybird': 'Analytics',
    'React Router': 'JavaScript frameworks',
    'HSTS': 'Security',
    'Open Graph': 'Miscellaneous'
  };
  return categories[techName] || 'Tools';
}

// Process page data
async function handlePageData(pageData, tab, sendResponse) {
  try {
    console.log('Processing page data from tab:', tab.id, tab.url);
    
    const technologies = analyzePage(pageData) || [];
    
    lastDetection = { 
      technologies: technologies, 
      url: tab.url,
      timestamp: Date.now()
    };
    
    console.log('Detected technologies:', technologies.length, technologies.map(t => t.name));
    
    updateBadge(tab.id, technologies);
    
    sendResponse({ 
      success: true, 
      technologies: technologies,
      url: tab.url
    });
    
  } catch (error) {
    console.error('Error processing page data:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Update badge
function updateBadge(tabId, technologies) {
  try {
    const count = technologies.length || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString(), tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

console.log('Background service worker ready');
