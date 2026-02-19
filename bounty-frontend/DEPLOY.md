# Deployment Guide - BountyBoard Frontend

## ✅ Build Status
Your build is **SUCCESSFUL**! The warning about chunk sizes is just a performance suggestion, not an error.

```
✓ 646 modules transformed.
✓ built in 4.59s
```

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd bounty-frontend
vercel
```

4. **Follow the prompts**:
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - What's your project's name? `bounty-board` (or any name)
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

5. **Deploy to production**:
```bash
vercel --prod
```

### Method 2: Vercel Dashboard (GitHub Integration)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

### Method 3: Manual Deploy via Vercel UI

1. **Build locally**:
```bash
npm run build
```

2. **Drag and drop** the `dist` folder to Vercel dashboard

## ⚙️ Vercel Configuration

The `vercel.json` file is already configured with:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ SPA routing support (rewrites to index.html)
- ✅ Asset caching headers

## 🔧 Required Settings

### Build Settings (Auto-configured)
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables (None required)
No environment variables needed - all contract info is in `contract.json`

## 📱 After Deployment

1. **Test the deployed app**:
   - Visit the Vercel URL
   - Connect Pera Wallet
   - Try creating a test task

2. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records

## 🐛 Troubleshooting

### Issue: "404 Not Found" on routes
**Solution**: Already fixed with `vercel.json` rewrites configuration

### Issue: "Module not found" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
vercel --prod
```

### Issue: Build fails on Vercel
**Check**:
1. Node version (should be 18.x or higher)
2. All dependencies in package.json
3. Build logs in Vercel dashboard

### Issue: Large bundle warning
**Note**: This is just a performance warning, not an error. The app works fine.
**To fix** (optional):
- Implement code splitting with React.lazy()
- Configure manual chunks in vite.config.ts

## 📊 Deployment Checklist

- ✅ Build completed successfully locally
- ✅ `vercel.json` configuration added
- ✅ `.vercelignore` added
- ✅ Contract info in `contract.json`
- ✅ Pera Wallet integration working
- ✅ All TypeScript errors fixed
- ✅ Production build optimized

## 🎉 Your App is Ready!

**Local build size**:
- HTML: 0.63 kB
- CSS: 22.41 kB (gzipped: 5.10 kB)
- JS: ~1.3 MB (gzipped: ~360 kB)

**Contract Details**:
- App ID: 741636419
- Network: Algorand TestNet
- Wallet: Pera Wallet (WalletConnect)

---

## Quick Deploy Command

```bash
# One-line deploy
cd bounty-frontend && vercel --prod
```

That's it! Your BountyBoard dApp is ready for production! 🚀
