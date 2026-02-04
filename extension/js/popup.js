// Popup script - handles UI and interactions

console.log('Popup.js loaded');

class PopupManager {
  constructor() {
    this.technologies = [];
    this.currentTab = null;
    this.loading = false;
    this.init();
  }

  async init() {
    try {
      console.log('PopupManager initializing...');
      this.setupEventListeners();
      await this.loadCurrentTab();
      
      // Get detection results from background
      setTimeout(() => this.getDetectedTechnologies(), 500);
      
      // Also try to trigger content script to send fresh data
      this.triggerAnalysis();
    } catch (error) {
      console.error('Init error:', error);
      this.showError('Error initializing: ' + error.message);
    }
  }

  setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refresh());
    if (exportBtn) exportBtn.addEventListener('click', () => this.export());
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettings());
  }

  async loadCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
    console.log('Current tab:', this.currentTab?.url);
  }

  triggerAnalysis() {
    if (!this.currentTab) return;
    
    try {
      chrome.tabs.sendMessage(this.currentTab.id, { type: 'COLLECT_DATA' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not ready:', chrome.runtime.lastError);
        } else {
          console.log('Data collection triggered');
        }
      });
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  }

  async getDetectedTechnologies() {
    try {
      console.log('Getting detected technologies...');
      
      // Get results from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'GET_LAST_DETECTION' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('Message error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.technologies) {
        this.technologies = response.technologies;
        console.log('Technologies loaded:', this.technologies);
      } else {
        this.technologies = [];
        console.log('No technologies found');
      }

      this.render();
    } catch (error) {
      console.error('Error getting technologies:', error);
      this.technologies = [];
      this.render();
    }
  }

  render() {
    try {
      const status = document.getElementById('status');
      const content = document.getElementById('content');
      const error = document.getElementById('error');
      const noTechs = document.getElementById('noTechs');

      // Ensure elements exist
      if (!status || !content || !error || !noTechs) {
        console.error('Required DOM elements not found');
        return;
      }

      // Hide all
      status.style.display = 'none';
      content.style.display = 'none';
      error.style.display = 'none';
      noTechs.style.display = 'none';

      // Check if we have technologies
      if (!this.technologies || this.technologies.length === 0) {
        noTechs.style.display = 'block';
        return;
      }

      // Show content
      content.style.display = 'block';

      // Render technologies list
      this.renderTechnologiesList();

      // Render categories
      this.renderCategories();

      // Render statistics
      this.renderStatistics();
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  renderTechnologiesList() {
    try {
      const list = document.getElementById('technologiesList');
      if (!list) {
        console.error('technologiesList element not found');
        return;
      }
      
      list.innerHTML = '';

      // Sort by confidence
      const sorted = [...this.technologies].sort((a, b) => {
        const confA = (a.confidence || 0);
        const confB = (b.confidence || 0);
        return confB - confA;
      });

      for (const tech of sorted) {
        if (tech && tech.name) {
          const item = this.createTechItem(tech);
          if (item) {
            list.appendChild(item);
          }
        }
      }
    } catch (error) {
      console.error('Error rendering tech list:', error);
    }
  }

  createTechItem(tech) {
    try {
      if (!tech || !tech.name) {
        return null;
      }

      const item = document.createElement('div');
      item.className = 'tech-item';

      const name = document.createElement('div');
      name.className = 'tech-name';
      name.textContent = tech.name || 'Unknown';

      const category = document.createElement('div');
      category.className = 'tech-category';
      category.textContent = tech.category || 'Other';

      const confidence = document.createElement('div');
      confidence.className = 'tech-confidence';
      const conf = Math.round((tech.confidence || 0));
      confidence.innerHTML = `
        <span class="confidence-value">${conf}%</span>
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${conf}%"></div>
        </div>
      `;

      item.appendChild(name);
      item.appendChild(category);
      item.appendChild(confidence);

      return item;
    } catch (error) {
      console.error('Error creating tech item:', error);
      return null;
    }
  }

  renderCategories() {
    try {
      const list = document.getElementById('categoriesList');
      if (!list) {
        console.error('categoriesList element not found');
        return;
      }

      list.innerHTML = '';

      const grouped = Utils.groupByCategory(this.technologies);
      if (!grouped) {
        console.error('Failed to group technologies');
        return;
      }

      // Sort to show AI services first
      const sortedEntries = Object.entries(grouped).sort(([catA], [catB]) => {
        if (catA.includes('AI')) return -1;
        if (catB.includes('AI')) return 1;
        return 0;
      });

      for (const [category, techs] of sortedEntries) {
        if (!category || !techs || techs.length === 0) continue;

        const categoryDiv = document.createElement('div');
        const isAI = category.includes('AI');
        categoryDiv.className = isAI ? 'category-item ai-category' : 'category-item';

        const header = document.createElement('div');
        header.className = 'category-header';
        const icon = isAI ? '🤖' : '📁';
        header.innerHTML = `
          <span class="category-name">${icon} ${category}</span>
          <span class="category-count">${techs.length}</span>
        `;

        const items = document.createElement('div');
        items.className = 'category-items';

        for (const tech of techs) {
          if (tech && tech.name) {
            const item = document.createElement('div');
            item.className = isAI ? 'category-tech ai-tech' : 'category-tech';
            item.textContent = tech.name;
            items.appendChild(item);
          }
        }

        categoryDiv.appendChild(header);
        categoryDiv.appendChild(items);
        list.appendChild(categoryDiv);
      }
    } catch (error) {
      console.error('Error rendering categories:', error);
    }
  }

  renderStatistics() {
    try {
      if (!this.technologies || this.technologies.length === 0) {
        document.getElementById('statTotal').textContent = '0';
        document.getElementById('statConfidence').textContent = '0%';
        document.getElementById('statCategories').textContent = '0';
        return;
      }

      const total = this.technologies.length;
      
      let sum = 0;
      let count = 0;
      for (const tech of this.technologies) {
        if (tech && tech.confidence) {
          sum += tech.confidence;
          count++;
        }
      }
      const avgConfidence = count > 0 ? Math.round(sum / count) : 0;
      
      const categories = new Set(this.technologies.filter(t => t && t.category).map(t => t.category)).size;

      const statTotal = document.getElementById('statTotal');
      const statConfidence = document.getElementById('statConfidence');
      const statCategories = document.getElementById('statCategories');

      if (statTotal) statTotal.textContent = total;
      if (statConfidence) statConfidence.textContent = avgConfidence + '%';
      if (statCategories) statCategories.textContent = categories;
    } catch (error) {
      console.error('Error rendering statistics:', error);
    }
  }

  setStatus(message, loading = false) {
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = message;
    status.classList.toggle('loading', loading);
    status.style.display = 'block';
  }

  showError(message) {
    const error = document.getElementById('error');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    error.style.display = 'block';
  }

  refresh() {
    this.technologies = [];
    this.setStatus('Analyzing page...', true);
    setTimeout(() => this.getDetectedTechnologies(), 1000);
  }

  export() {
    const data = {
      url: this.currentTab.url,
      timestamp: new Date().toISOString(),
      technologies: this.technologies
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  setStatus(message, loading = false) {
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    if (statusText) statusText.textContent = message;
    if (status) {
      status.classList.toggle('loading', loading);
      status.style.display = 'block';
    }
  }

  showError(message) {
    const error = document.getElementById('error');
    const errorText = document.getElementById('errorText');
    
    if (errorText) errorText.textContent = message;
    if (error) error.style.display = 'block';
  }
}

// Initialize popup manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
  });
} else {
  new PopupManager();
}
