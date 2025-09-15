# 🚀 GoDaddy Deployment Guide

## ✅ Static Export Setup Complete!

Your Next.js portfolio has been successfully configured for static export and is ready for GoDaddy deployment.

## 📁 What Was Changed

### 1. **next.config.js** - Static Export Configuration
```javascript
{
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}
```

### 2. **package.json** - Added Export Script
```json
{
  "scripts": {
    "export": "next build"
  }
}
```

## 🔨 Build Process

To generate static files for deployment:

```bash
npm run export
```

This creates an `out/` folder with all static files ready for upload.

## 📤 GoDaddy cPanel Deployment Steps

### Step 1: Access cPanel
1. Log into your GoDaddy hosting account
2. Open **cPanel**
3. Go to **File Manager**

### Step 2: Navigate to Domain Folder
1. In File Manager, navigate to your domain folder (usually `public_html` or `www`)
2. **Delete any existing files** in the domain folder (backup first if needed)

### Step 3: Upload Static Files
1. **Upload ALL contents** from your local `out/` folder to the domain folder
2. Upload these files and folders:
   - `index.html`
   - `404.html` 
   - `_next/` (entire folder)
   - `fonts/` (entire folder)
   - Any other files in the `out/` folder

### Step 4: Set Permissions (if needed)
1. Select all uploaded files
2. Set permissions to **755** for folders and **644** for files

## 🌐 Domain Configuration

### Option 1: Main Domain (raitiskraslovskis.com)
- Upload files to `public_html/`
- Your site will be live at `https://raitiskraslovskis.com`

### Option 2: Subdomain (portfolio.raitiskraslovskis.com)
- Create a subdomain in cPanel
- Upload files to the subdomain folder

## 🔄 Future Updates

When you make changes to your portfolio:

1. **Make your changes locally**
2. **Run the export command:**
   ```bash
   npm run export
   ```
3. **Upload the new `out/` folder contents** to replace the old files on GoDaddy
4. **Clear browser cache** to see changes

## ⚡ Quick Deployment Checklist

- [ ] Run `npm run export` locally
- [ ] Check `out/` folder was created
- [ ] Log into GoDaddy cPanel
- [ ] Open File Manager
- [ ] Navigate to domain folder (public_html)
- [ ] Delete old files (backup first!)
- [ ] Upload ALL contents from `out/` folder
- [ ] Set proper permissions if needed
- [ ] Visit your domain to verify

## 🆘 Troubleshooting

### Issue: Site not loading
- **Check**: All files uploaded correctly
- **Check**: `index.html` is in the root domain folder
- **Check**: File permissions are correct (755/644)

### Issue: Fonts not loading
- **Check**: `fonts/` folder uploaded completely
- **Check**: `_next/` folder uploaded completely

### Issue: Navigation not working
- **Check**: All JavaScript files in `_next/static/` uploaded
- **Clear**: Browser cache and try again

## 📞 Support

If you encounter issues:
1. Check GoDaddy's cPanel documentation
2. Verify all files uploaded completely
3. Test the site in incognito mode (clears cache)

Your portfolio is now ready for the world! 🎉