# Quick Start Guide - Tech Detective Extension

## ⚡ Get Started in 2 Minutes

### Step 1: Load the Extension (1 minute)

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in address bar
   - Press Enter

2. **Enable Developer Mode**
   - Look for toggle in top-right corner
   - Click it to enable

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to: `c:\Users\FIX\webdevelopment\wappalyzier\extension`
   - Click "Open"

4. **Verify Success**
   - You should see "Tech Detective" in the extensions list
   - Icon appears in Chrome toolbar

### Step 2: Test the Extension (1 minute)

1. **Visit a Website**
   - Go to any popular website
   - Examples: `github.com`, `google.com`, `facebook.com`

2. **Click the Extension Icon**
   - Icon is in the Chrome toolbar (top-right)
   - Purple icon with 🔍 symbol

3. **See Results**
   - Popup shows all detected technologies
   - View by category
   - See confidence scores

## 🎯 What to Expect

### First Run - You Should See:

**React Websites:**
- github.com → React, Webpack, etc.
- facebook.com → React, Redux, etc.
- netflix.com → React, etc.

**WordPress Sites:**
- Most blogs → WordPress, PHP, MySQL, etc.

**JavaScript Frameworks:**
- Most modern sites → jQuery, React, Vue, Angular, etc.

**Analytics:**
- Most sites → Google Analytics, Mixpanel, etc.

**Payment/Hosting:**
- Shopify stores → Stripe, Shopify, etc.

## 📊 Understanding the Popup

### Technologies List
```
Technology Name
Category → (e.g., "JavaScript Frameworks")
Confidence Bar → [████████░░] 85%
```

### Confidence Levels
- **90-100%** - Very certain (multiple signals match)
- **70-89%** - Confident (2-3 signals match)
- **50-69%** - Possible (1-2 signals match)
- **<50%** - Filtered out (too uncertain)

### By Category
Technologies grouped:
```
📂 JavaScript Frameworks (3)
   - React
   - Redux
   - Webpack

📂 CSS Frameworks (1)
   - Bootstrap

📂 Analytics (2)
   - Google Analytics
   - Mixpanel
```

### Statistics
- **Total Technologies** - Count of all detected
- **Average Confidence** - Mean confidence score
- **Categories** - How many categories represented

## ⚙️ Features

### 🔄 Refresh Analysis
- Re-scans current page
- Gets latest data
- Updates results

### 📥 Export Data
- Downloads JSON file
- Contains all detected tech
- Format: `tech-detection-[timestamp].json`
- Use for reports/analysis

### ⚙️ Settings
- Open options page
- Future: Configure detection patterns
- Future: Set custom exclusions

## 🧠 How It Works (Behind the Scenes)

### The Detection Process:

1. **Page Loads** (0ms)
   - You visit a website

2. **Content Script Activates** (0-50ms)
   - Automatically injected
   - Collects page data

3. **Data Collected** (50-150ms)
   - Gathers: HTML, scripts, JS variables, headers
   - Sends to background script

4. **Analysis Runs** (150-400ms)
   - Compares against 100+ patterns
   - Calculates confidence

5. **Results Displayed** (400-550ms)
   - Popup updates
   - Badge shows count
   - Data cached for 24 hours

### Why Caching?
- **Fast Results** - Visit same site again = instant results
- **Lower CPU** - No re-analysis needed
- **Smart** - 24-hour TTL keeps data fresh

## 🔐 Privacy & Security

✅ **What the extension does:**
- Runs entirely in your browser
- No data sent to servers
- No tracking or profiling
- Results stored locally only

❌ **What it doesn't do:**
- Doesn't spy on you
- Doesn't change page content
- Doesn't steal data
- Doesn't modify browsing

## 🐛 Troubleshooting

### Problem: Popup shows "No technologies detected"

**Solution:**
1. Reload the page (Ctrl+R)
2. Wait 2 seconds
3. Click extension icon again
4. Try a different website (e.g., facebook.com)

### Problem: Extension not in toolbar

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Tech Detective"
3. Click the pin icon to pin it
4. Should appear in toolbar

### Problem: Getting errors

**Solution:**
1. Open DevTools (F12)
2. Go to Console tab
3. Check for red errors
4. Try reloading the page

### Problem: Not detecting React/jQuery/etc

**Solution:**
1. Check website is actually using the tech
   - Right-click → View Page Source
   - Search for technology name
   
2. Try another website known to use it

3. Click "Refresh Analysis" button

## 📈 Common Detections by Website Type

### Social Media
- **Facebook, Instagram** → React, GraphQL, etc.
- **Twitter** → React, Webpack, etc.
- **LinkedIn** → React, etc.

### E-commerce
- **Amazon** → Java, Tomcat, DynamoDB, etc.
- **Shopify** → Ruby on Rails, etc.
- **eBay** → Java, Oracle, etc.

### News/Media
- **Medium** → React, Node.js, etc.
- **CNN** → Akamai CDN, etc.
- **NY Times** → Node.js, etc.

### Tech
- **GitHub** → Rails, React, etc.
- **Stack Overflow** → ASP.NET, etc.
- **Google** → GWS, Closure, etc.

## 🎓 Learning Resources

Want to understand more?

1. **How Detection Works**
   - See: `extension/README.md`
   - Section: "How It Works"

2. **Adding Technologies**
   - See: `extension/README.md`
   - Section: "Adding New Technologies"

3. **Understanding Patterns**
   - See: `extension/technologies/technologies.json`
   - Each technology has example patterns

## 📝 Next Steps

### If You Want to:

**Use as-is:**
- Start using the extension now!
- Visit various websites
- Explore what tech they use

**Add More Technologies:**
- Edit `extension/technologies/technologies.json`
- Add new patterns
- Reload extension

**Build Features:**
- Modify popup UI
- Change styling
- Add competitor analysis
- Add AI detection

**Debug Issues:**
- Open DevTools (F12)
- Check Console for messages
- Review error messages

## 💡 Pro Tips

1. **Pin the Extension**
   - Click extension icon location
   - Pin to toolbar for quick access

2. **Check Popular Sites**
   - Visit big tech companies first
   - They usually use many technologies
   - Better for learning

3. **Compare Competitors**
   - Analyze 2-3 sites in same category
   - See tech differences
   - Understand market choices

4. **Export & Share**
   - Use Export button to save data
   - Share detections with team
   - Create reports

## ❓ FAQ

**Q: Is this private/secure?**
A: Yes! Everything runs locally. No data is sent anywhere.

**Q: Can I detect AI services?**
A: Yes! Look for "AI Services" category. Currently detects OpenAI.

**Q: How often is it updated?**
A: Edit technologies.json to add new ones instantly.

**Q: Can I use this for competitive analysis?**
A: Yes! Export data to analyze competitor tech stacks.

**Q: Does it slow down my browser?**
A: No! Runs in background. <50ms impact per page.

**Q: Can I trust the results?**
A: Generally yes. Confidence score shows certainty level. 90%+ is very reliable.

---

**Ready to explore?** Click the extension icon on any website and start discovering! 🚀

Version: 1.0.0
