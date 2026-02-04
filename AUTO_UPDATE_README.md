# Auto-Update Configuration

## Files Created

### 1. `.gitignore`
Configured for the Wappalyzer extension project. Excludes:
- Node modules and dependencies
- IDE files (.vscode, .idea)
- Build outputs
- Backup files
- OS files
- Chrome extension specific files

### 2. `UPDATES.json`
Main update manifest in JSON format containing:
- Version information
- Release dates
- Feature lists
- Bug fixes
- Technology counts
- Compatibility info
- Author information

**Use for:** Automated update checking, version management

### 3. `UPDATES.csv`
Excel-compatible CSV format with:
- Version release schedule
- Feature counts
- All 40+ supported technologies
- All 20 categories
- Complete changelog

**Use for:** Import into Excel/Google Sheets, tracking

### 4. `extension/AUTO_UPDATE.json`
Configuration file for auto-update functionality:
- Check interval: 24 hours (86400 seconds)
- Update source: GitHub API
- Current version tracking
- Rollback capability
- Notification settings

**Use for:** Automatic update checking and installation

## How to Set Up Auto-Update

### Option 1: GitHub Integration
```json
{
  "updateSource": "https://api.github.com/repos/YOUR_USER/wappalyzier/releases/latest"
}
```

### Option 2: Custom Server
```json
{
  "updateSource": "https://your-server.com/updates.json"
}
```

### Option 3: Google Drive / Cloud Storage
```json
{
  "updateSource": "https://drive.google.com/uc?id=YOUR_FILE_ID"
}
```

## Automatic Update Check Schedule

- **Interval:** Every 24 hours
- **When:** On extension startup and periodically
- **Action:** Check `updateSource` for new version
- **Behavior:** Notify user or auto-install (configurable)

## Manual Update

To manually trigger update check:
1. Edit `AUTO_UPDATE.json`
2. Set `checkInterval: 0` (check immediately)
3. Or call from background script:
```javascript
chrome.runtime.getURL('AUTO_UPDATE.json')
```

## Version Management

### Current Version
- **v1.0.0** (2026-02-04)
- 40+ technologies
- 15 categories
- Full AI detection

### Planned Versions
- **v1.1.0** (2026-03-01) - 50 technologies
- **v1.2.0** (2026-04-01) - 60 technologies + API
- **v1.3.0** (2026-05-01) - Advanced analytics
- **v1.4.0** (2026-06-01) - Mobile support

## Files to Track

Keep these files in Git for version tracking:
- ✅ `.gitignore` - Git ignore rules
- ✅ `UPDATES.json` - Update manifest
- ✅ `UPDATES.csv` - Spreadsheet version
- ✅ `extension/AUTO_UPDATE.json` - Auto-update config
- ✅ `manifest.json` - Extension version

## Next Steps

1. Upload to GitHub and configure releases
2. Set `updateSource` to your GitHub API endpoint
3. Extension will automatically check for updates
4. Users notified when new versions available
5. Can auto-install or require manual update

---

**Author:** Rafid Siddique
**Created:** 2026-02-04
**Project:** Wappalyzier Chrome Extension
