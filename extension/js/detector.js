// Core technology detection engine - Enhanced with AI Detection
// Compatible with Wappalyzer methodology

class Detector {
  constructor() {
    this.technologies = {};
    this.detectedTechs = [];
    this.patterns = {
      html: [],
      headers: [],
      cookies: [],
      scripts: [],
      dom: [],
      js: []
    };
  }

  // Initialize detector with technology database
  async initialize() {
    try {
      this.technologies = await this.loadTechnologies();
      console.log('Detector initialized with', Object.keys(this.technologies).length, 'technologies');
      return true;
    } catch (e) {
      console.error('Error initializing detector:', e);
      return false;
    }
  }

  // Load technology database (Wappalyzer format compatible)
  async loadTechnologies() {
    const techs = {
      // JavaScript Frameworks
      'React': {
        name: 'React',
        category: 'JavaScript Frameworks',
        icon: 'React.svg',
        website: 'https://react.dev',
        patterns: {
          html: ['React.createElement', 'data-react', 'react-root'],
          js: ['window.__REACT', '__REACT_DEVTOOLS', 'window.React'],
          scripts: ['/react\\..*\\.js', '/react-dom\\..*\\.js'],
          headers: [],
          dom: ['[data-reactroot]', '[data-react-app]']
        }
      },
      'Vue.js': {
        name: 'Vue.js',
        category: 'JavaScript Frameworks',
        icon: 'Vue.svg',
        website: 'https://vuejs.org',
        patterns: {
          html: ['v-app', 'v-bind', 'v-model', 'data-v-'],
          js: ['window.__VUE__', 'window.Vue', 'window.__VUE_DEVTOOLS__'],
          scripts: ['/vue\\..*\\.js'],
          headers: []
        }
      },
      'Angular': {
        name: 'Angular',
        category: 'JavaScript Frameworks',
        icon: 'Angular.svg',
        website: 'https://angular.io',
        patterns: {
          html: ['ng-app', 'ng-model', 'ng-bind', 'data-ng-'],
          js: ['window.angular', 'ng.version'],
          scripts: ['/angular.*\\.js'],
          headers: []
        }
      },
      'jQuery': {
        name: 'jQuery',
        category: 'JavaScript Libraries',
        icon: 'jQuery.svg',
        website: 'https://jquery.com',
        patterns: {
          html: [],
          js: ['window.jQuery', 'window.$', 'jQuery.fn.jquery'],
          scripts: ['/jquery.*\\.js'],
          headers: []
        }
      },
      
      // CSS Frameworks
      'Bootstrap': {
        name: 'Bootstrap',
        category: 'CSS Frameworks',
        icon: 'Bootstrap.svg',
        website: 'https://getbootstrap.com',
        patterns: {
          html: ['class="container"', 'class="row"', 'class="col-', 'bootstrap'],
          js: [],
          scripts: ['/bootstrap.*\\.js', '/bootstrap.*\\.css'],
          headers: []
        }
      },
      
      // CMS
      'WordPress': {
        name: 'WordPress',
        category: 'CMS',
        icon: 'WordPress.svg',
        website: 'https://wordpress.org',
        patterns: {
          html: ['wp-content', 'wp-includes', 'wp-json'],
          js: ['window.wp', 'window.wpApiSettings'],
          scripts: ['/wp-content/', '/wp-includes/'],
          headers: ['X-Powered-By: WordPress']
        }
      },
      
      // Analytics
      'Google Analytics': {
        name: 'Google Analytics',
        category: 'Analytics',
        icon: 'Google Analytics.svg',
        website: 'https://analytics.google.com',
        patterns: {
          html: ['ga', 'gtag', 'analytics'],
          js: ['window.ga', 'window.gtag', 'window.gaData'],
          scripts: ['/google-analytics', '/googletagmanager', '/analytics.js', '/gtag.js'],
          headers: []
        }
      },
      'Mixpanel': {
        name: 'Mixpanel',
        category: 'Analytics',
        icon: 'Mixpanel.svg',
        website: 'https://mixpanel.com',
        patterns: {
          html: ['mixpanel'],
          js: ['window.mixpanel'],
          scripts: ['/mixpanel'],
          headers: []
        }
      },
      
      // ===== AI SERVICES & LLM DETECTION =====
      'OpenAI': {
        name: 'OpenAI',
        category: 'AI Services',
        icon: 'OpenAI.svg',
        website: 'https://openai.com',
        patterns: {
          html: ['openai', 'gpt', 'chatgpt', 'data-openai', 'api-key'],
          js: ['window.ChatGPT', 'window.openai', 'OPENAI_API_KEY', 'sk-'],
          scripts: ['api.openai.com', 'platform.openai.com', 'cdn.openai.com', 'chat.openai.com'],
          headers: ['Authorization', 'sk-'],
          dom: ['data-openai', 'data-testid']
        }
      },
      'Claude (Anthropic)': {
        name: 'Claude',
        category: 'AI Services',
        icon: 'Claude.svg',
        website: 'https://anthropic.com',
        patterns: {
          html: ['claude', 'anthropic', 'claude-ai', 'claude\\.ai'],
          js: ['window.Claude', 'window.Anthropic', 'anthropic\\.api', 'ANTHROPIC_API_KEY'],
          scripts: ['api\\.anthropic\\.com', 'claude-ai', 'claude\\.ai'],
          headers: ['Authorization.*Bearer.*claude-']
        }
      },
      'Google Gemini': {
        name: 'Google Gemini',
        category: 'AI Services',
        icon: 'Google.svg',
        website: 'https://gemini.google.com',
        patterns: {
          html: ['gemini', 'bard', 'google.*ai', 'gemini\\.google\\.com'],
          js: ['window.Gemini', 'window.GoogleAI', 'google\\.ai', 'GEMINI_API_KEY'],
          scripts: ['generativelanguage\\.googleapis\\.com', 'ai\\.google\\.dev', 'gemini'],
          headers: []
        }
      },
      'Hugging Face': {
        name: 'Hugging Face',
        category: 'AI Services',
        icon: 'HuggingFace.svg',
        website: 'https://huggingface.co',
        patterns: {
          html: ['hugging.face', 'huggingface', 'hf_'],
          js: ['window.HuggingFace', 'huggingface\\.co/models', 'HF_API_TOKEN'],
          scripts: ['cdn-lfs\\.huggingface\\.co', 'huggingface\\.co/inference', 'huggingface\\.js'],
          headers: ['Authorization.*Bearer.*hf_']
        }
      },
      'Replicate': {
        name: 'Replicate',
        category: 'AI Services',
        icon: 'Replicate.svg',
        website: 'https://replicate.com',
        patterns: {
          html: ['replicate', 'replicate\\.com'],
          js: ['window.Replicate', 'replicate\\.com/api', 'REPLICATE_API_TOKEN'],
          scripts: ['api\\.replicate\\.com', 'replicate\\.com/api'],
          headers: ['Authorization.*Token.*r8_']
        }
      },
      'Cohere': {
        name: 'Cohere',
        category: 'AI Services',
        icon: 'Cohere.svg',
        website: 'https://cohere.ai',
        patterns: {
          html: ['cohere'],
          js: ['window.Cohere', 'cohere\\.api', 'COHERE_API_KEY'],
          scripts: ['api\\.cohere\\.ai'],
          headers: []
        }
      },
      'Vercel AI': {
        name: 'Vercel AI',
        category: 'AI Services',
        icon: 'Vercel.svg',
        website: 'https://vercel.com/ai',
        patterns: {
          html: ['vercel.*ai', 'ai\\.vercel'],
          js: ['window.VercelAI', 'ai\\.useChat', 'useCompletion', 'useCompletionStore'],
          scripts: ['/ai\\.js', 'sdk\\.vercel\\.ai'],
          headers: []
        }
      },
      'Llama 2': {
        name: 'Llama 2',
        category: 'AI Services',
        icon: 'Meta.svg',
        website: 'https://llama.meta.com',
        patterns: {
          html: ['llama', 'meta.*ai', 'llama2'],
          js: ['window.Llama', 'llama\\.api', 'window.MetaAI'],
          scripts: ['llama', 'meta\\.ai', 'huggingface\\.co/meta-llama'],
          headers: []
        }
      },
      'Together AI': {
        name: 'Together AI',
        category: 'AI Services',
        icon: 'TogetherAI.svg',
        website: 'https://www.together.ai',
        patterns: {
          html: ['together', 'together\\.ai'],
          js: ['window.TogetherAI', 'together\\.api'],
          scripts: ['api\\.together\\.xyz', 'together\\.ai'],
          headers: []
        }
      },
      
      // ===== AI DEVELOPMENT FRAMEWORKS =====
      'LangChain': {
        name: 'LangChain',
        category: 'AI Development',
        icon: 'LangChain.svg',
        website: 'https://langchain.com',
        patterns: {
          html: ['langchain', 'agent', 'chain'],
          js: ['window.LangChain', 'langchain', 'ConversationChain', 'LLMChain', 'Agent'],
          scripts: ['langchain', 'npm/langchain', 'langchain\\.js'],
          headers: []
        }
      },
      'LlamaIndex': {
        name: 'LlamaIndex',
        category: 'AI Development',
        icon: 'LlamaIndex.svg',
        website: 'https://www.llamaindex.ai',
        patterns: {
          html: ['llamaindex', 'gpt\\.index'],
          js: ['window.LlamaIndex', 'gpt_index', 'index\\.query'],
          scripts: ['llamaindex', 'gpt_index', 'npm/llamaindex'],
          headers: []
        }
      },
      
      // ===== ML FRAMEWORKS =====
      'TensorFlow.js': {
        name: 'TensorFlow.js',
        category: 'ML Framework',
        icon: 'TensorFlow.svg',
        website: 'https://tensorflow.org/js',
        patterns: {
          html: ['tensorflow', 'tfjs'],
          js: ['window.tf', 'tensorflow', 'window.TensorFlow', 'tf\\.sequential'],
          scripts: ['cdn\\.jsdelivr\\.net/npm/@tensorflow/tfjs', 'tfjs', 'tensorflow\\.js'],
          headers: []
        }
      },
      'PyTorch': {
        name: 'PyTorch',
        category: 'ML Framework',
        icon: 'PyTorch.svg',
        website: 'https://pytorch.org',
        patterns: {
          html: ['pytorch', 'torch\\.js'],
          js: ['window.torch', 'pytorch', 'window.PyTorch'],
          scripts: ['pytorch', 'torch\\.js', 'onnxruntime'],
          headers: []
        }
      },
      
      // Cloud & Hosting
      'AWS': {
        name: 'AWS',
        category: 'Hosting',
        icon: 'AWS.svg',
        website: 'https://aws.amazon.com',
        patterns: {
          html: ['amazonaws', 's3\\.', 'cloudfront'],
          js: ['AWS', 'amazon'],
          scripts: ['/amazonaws', 's3'],
          headers: ['Server: AmazonS3', 'Server: CloudFront']
        }
      },
      'Google Cloud': {
        name: 'Google Cloud',
        category: 'Hosting',
        icon: 'Google Cloud.svg',
        website: 'https://cloud.google.com',
        patterns: {
          html: ['gstatic\\.com', 'appspot\\.com', 'firebase'],
          js: [],
          scripts: ['/gstatic', 'appspot\\.com'],
          headers: []
        }
      },
      'Cloudflare': {
        name: 'Cloudflare',
        category: 'CDN',
        icon: 'Cloudflare.svg',
        website: 'https://cloudflare.com',
        patterns: {
          html: ['cloudflare'],
          js: [],
          scripts: [],
          headers: ['Server: cloudflare', 'CF-RAY']
        }
      }
    };
    return techs;
  }

  // Detect from HTML
  detectFromHTML(html) {
    const detected = [];
    
    for (const [techName, tech] of Object.entries(this.technologies)) {
      if (!tech.patterns || !tech.patterns.html) continue;
      
      const confidence = this.checkPatterns(html, tech.patterns.html);
      if (confidence > 0) {
        detected.push({
          name: techName,
          category: tech.category,
          confidence: confidence,
          source: 'html'
        });
      }
    }
    
    return detected;
  }

  // Detect from scripts
  detectFromScripts(scripts) {
    const detected = [];
    
    for (const [techName, tech] of Object.entries(this.technologies)) {
      if (!tech.patterns || !tech.patterns.scripts) continue;
      
      for (const script of scripts) {
        const confidence = this.checkPatterns(script, tech.patterns.scripts);
        if (confidence > 0) {
          detected.push({
            name: techName,
            category: tech.category,
            confidence: confidence,
            source: 'script',
            script: script.substring(0, 50)
          });
        }
      }
    }
    
    return detected;
  }

  // Detect from JavaScript window object
  detectFromJS(jsVars) {
    const detected = [];
    
    for (const [techName, tech] of Object.entries(this.technologies)) {
      if (!tech.patterns || !tech.patterns.js) continue;
      
      const confidence = this.checkPatterns(jsVars, tech.patterns.js);
      if (confidence > 0) {
        detected.push({
          name: techName,
          category: tech.category,
          confidence: confidence,
          source: 'javascript'
        });
      }
    }
    
    return detected;
  }

  // Detect from HTTP headers
  detectFromHeaders(headers) {
    const detected = [];
    
    for (const [techName, tech] of Object.entries(this.technologies)) {
      if (!tech.patterns || !tech.patterns.headers) continue;
      
      const confidence = this.checkPatterns(JSON.stringify(headers), tech.patterns.headers);
      if (confidence > 0) {
        detected.push({
          name: techName,
          category: tech.category,
          confidence: confidence,
          source: 'header'
        });
      }
    }
    
    return detected;
  }

  // Detect from DOM elements
  detectFromDOM(dom) {
    const detected = [];
    
    for (const [techName, tech] of Object.entries(this.technologies)) {
      if (!tech.patterns || !tech.patterns.dom) continue;
      
      const confidence = this.checkPatterns(JSON.stringify(dom), tech.patterns.dom);
      if (confidence > 0) {
        detected.push({
          name: techName,
          category: tech.category,
          confidence: confidence,
          source: 'dom'
        });
      }
    }
    
    return detected;
  }

  // Check patterns against string (Wappalyzer compatible regex matching)
  checkPatterns(content, patterns) {
    if (!Array.isArray(patterns)) patterns = [patterns];
    
    let matches = 0;
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(String(content))) {
          matches++;
        }
      } catch (e) {
        console.error('Invalid pattern:', pattern, e);
      }
    }
    
    // Confidence based on number of patterns matched
    return (matches / patterns.length) * 100;
  }

  // Merge and deduplicate detections with confidence stacking
  mergeDetections(detections) {
    const merged = {};
    
    for (const detection of detections) {
      const key = detection.name;
      if (!merged[key]) {
        merged[key] = {
          name: detection.name,
          category: detection.category,
          confidence: detection.confidence,
          sources: [detection.source]
        };
      } else {
        // Boost confidence when found from multiple sources
        const signals = [merged[key].confidence, detection.confidence];
        merged[key].confidence = Utils.calculateConfidence(signals);
        merged[key].sources.push(detection.source);
      }
    }
    
    return Object.values(merged);
  }

  // Complete analysis (Wappalyzer methodology)
  analyze(pageData) {
    const results = [];
    
    // Detect from all sources
    const htmlDetections = this.detectFromHTML(pageData.html || '');
    results.push(...htmlDetections);
    
    const scriptDetections = this.detectFromScripts(pageData.scripts || []);
    results.push(...scriptDetections);
    
    const jsDetections = this.detectFromJS(pageData.jsVars || '');
    results.push(...jsDetections);
    
    const headerDetections = this.detectFromHeaders(pageData.headers || {});
    results.push(...headerDetections);
    
    const domDetections = this.detectFromDOM(pageData.dom || []);
    results.push(...domDetections);
    
    // Merge and filter
    const merged = this.mergeDetections(results);
    const filtered = merged.filter(t => t.confidence >= 50);
    
    // Sort by confidence
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    return filtered;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Detector;
}
