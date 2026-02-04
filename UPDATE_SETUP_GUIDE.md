# Chrome Extension Auto-Update Guide

## Files Structure

```
/wappalyzier                    ← ROOT (Project root)
├── updates.xml                 ← AUTO-UPDATE CONFIG (OUTSIDE extension)
├── UPDATES.json                ← VERSION MANIFEST
├── UPDATES.csv                 ← SPREADSHEET
├── AUTO_UPDATE_README.md
├── .gitignore
├── README.md
└── /extension                  ← EXTENSION CODE (INSIDE this folder)
    ├── manifest.json
    ├── html/
    ├── js/
    ├── css/
    ├── images/
    └── AUTO_UPDATE.json        ← LOCAL CONFIG
```

## Why updates.xml is OUTSIDE /extension?

✅ **Correct placement!** The `updates.xml` must be:
- In the **project root** (parent directory)
- NOT inside the extension folder
- Hosted on your server or GitHub

**Reason:** Chrome looks for updates at a URL you specify, not inside the extension package.

## How Chrome Extension Auto-Update Works

### Step 1: User's manifest.json (inside /extension)
```json
{
  "update_url": "https://YOUR-DOMAIN.com/updates.xml"
}
```

### Step 2: Chrome checks updates.xml
```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='3.0'>
  <app appid='YOUR_EXTENSION_ID'>
    <updatecheck codebase='https://your-server.com/extension.crx' version='1.0.1' />
  </app>
</gupdate>
```

### Step 3: Chrome downloads .crx file and updates

## Setup Instructions

### For GitHub (Recommended)

1. **Get your Extension ID:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Find your extension ID (long alphanumeric string)

2. **Update manifest.json:**
   ```json
   {
     "update_url": "https://raw.githubusercontent.com/RafidSiddiqueBangladesh/wappalyzier/main/updates.xml"
   }
   ```

3. **Update updates.xml:**
   ```xml
   <app appid='YOUR_EXTENSION_ID'>
     <updatecheck codebase='https://github.com/RafidSiddiqueBangladesh/wappalyzier/releases/download/v1.0.0/wappalyzier.crx' version='1.0.0' />
   </app>
   ```

4. **Create .crx file:**
   ```bash
   # In Chrome: chrome://extensions/
   # Click "Pack extension"
   # Select /extension folder
   # Gets private.pem key
   # Creates .crx file
   ```

5. **Upload to GitHub Releases:**
   - Create release v1.0.0
   - Upload the .crx file
   - Copy download URL to updates.xml

### For Custom Server

1. **Host updates.xml:**
   ```
   https://your-domain.com/updates.xml
   ```

2. **Host .crx file:**
   ```
   https://your-domain.com/extensions/wappalyzier.crx
   ```

3. **Update manifest.json:**
   ```json
   {
     "update_url": "https://your-domain.com/updates.xml"
   }
   ```

## File Locations After Setup

```
GitHub Repository (or Your Server)
├── updates.xml                 ← Chrome checks here for updates
├── releases/
│   └── download/v1.0.0/wappalyzier.crx  ← Extension package
```

## Update Frequency

- Chrome checks for updates: **Every 5 hours** (default)
- Manual check: User right-clicks extension → "Update"
- Can be configured in manifest with `update_url`

## Testing Auto-Update

### Local Testing:
1. Set `update_url` to local file
2. Navigate to `chrome://extensions/`
3. Click "Update extensions now"
4. Check if new version is detected

### Production:
1. Upload updates.xml to your server
2. Update manifest with production URL
3. Wait up to 5 hours for users to get update
4. Or manually trigger via `chrome://extensions/`

## Current Setup

Your extension now has:

✅ `/extension/` - Extension source code
✅ `updates.xml` - Auto-update configuration (ROOT)
✅ `UPDATES.json` - Version tracking
✅ `UPDATES.csv` - Excel compatible version

## Next Steps

1. Find your Extension ID from `chrome://extensions/`
2. Replace `YOUR_EXTENSION_ID` in `updates.xml`
3. Create GitHub releases with .crx files
4. Update manifest with your update_url
5. Users auto-update every 5 hours!

---

**Remember:** 
- ✅ `/extension/` = Extension code (packaged as .crx)
- ✅ `updates.xml` = Update manifest (hosted externally)
- ✅ They work together but live in different places
