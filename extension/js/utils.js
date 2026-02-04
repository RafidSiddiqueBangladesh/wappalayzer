// Utility functions for the extension

class Utils {
  // Extract version from string using patterns
  static extractVersion(string, pattern) {
    if (!string || !pattern) return null;
    
    try {
      const regex = new RegExp(pattern, 'i');
      const match = string.match(regex);
      
      if (match) {
        if (match[1]) return match[1];
        if (match[0]) return match[0];
      }
    } catch (e) {
      console.error('Error extracting version:', e);
    }
    return null;
  }

  // Clean and normalize version strings
  static normalizeVersion(version) {
    if (!version) return '';
    return String(version).trim().split(/[\s,;]+/)[0];
  }

  // Calculate confidence score
  static calculateConfidence(signals = []) {
    if (!signals || signals.length === 0) return 0;
    
    // Use confidence stacking: highest individual + incremental boost
    signals.sort((a, b) => b - a);
    let confidence = signals[0];
    
    for (let i = 1; i < signals.length; i++) {
      confidence += signals[i] * (1 - confidence / 100) * 0.1;
    }
    
    return Math.min(confidence, 100);
  }

  // Check if string matches regex pattern
  static matchPattern(string, pattern) {
    if (!string || !pattern) return false;
    
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(String(string));
    } catch (e) {
      console.error('Error matching pattern:', e);
      return false;
    }
  }

  // Deep clone object
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const cloned = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  }

  // Group technologies by category
  static groupByCategory(technologies) {
    const grouped = {};
    
    technologies.forEach(tech => {
      const category = tech.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(tech);
    });
    
    return grouped;
  }

  // Format technology for display
  static formatTechnology(tech) {
    const version = tech.version ? ` v${tech.version}` : '';
    const confidence = tech.confidence ? ` [${Math.round(tech.confidence)}%]` : '';
    return `${tech.name}${version}${confidence}`;
  }

  // Get current domain
  static getCurrentDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return '';
    }
  }

  // Format URL for display
  static formatUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.substring(0, 30);
    } catch (e) {
      return url.substring(0, 50);
    }
  }

  // Check if it's a valid URL
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get cache key for domain
  static getCacheKey(url) {
    const domain = this.getCurrentDomain(url);
    return `tech_cache_${domain}`;
  }

  // Format cache entry
  static createCacheEntry(technologies) {
    return {
      data: technologies,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  // Check if cache is valid
  static isCacheValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.expires) return false;
    return Date.now() < cacheEntry.expires;
  }

  // Parse HTML string safely
  static parseHTML(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc;
    } catch (e) {
      console.error('Error parsing HTML:', e);
      return null;
    }
  }

  // Extract domain info
  static extractDomainInfo(url) {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        domain: urlObj.hostname.replace('www.', ''),
        path: urlObj.pathname,
        query: urlObj.search
      };
    } catch (e) {
      return null;
    }
  }

  // Delay execution (for throttling)
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Deduplicate array of objects
  static deduplicateTechs(technologies) {
    const seen = new Set();
    return technologies.filter(tech => {
      const key = `${tech.name}_${tech.version || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
