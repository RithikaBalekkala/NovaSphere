# GitHub Commit Guide

## ✅ FILES TO COMMIT (Required for Vercel to build)

### 📁 **Folders to Include:**
```
✅ src/                    (Your source code - REQUIRED)
✅ public/                 (Public assets - if any)
```

### 📄 **Root Files to Include:**
```
✅ package.json           (Dependencies list - REQUIRED)
✅ package-lock.json      (Lock file - REQUIRED)
✅ vite.config.ts         (Vite configuration - REQUIRED)
✅ tsconfig.json          (TypeScript config - REQUIRED)
✅ tsconfig.app.json      (TypeScript config - REQUIRED)
✅ tsconfig.node.json     (TypeScript config - REQUIRED)
✅ tailwind.config.js     (Tailwind config - REQUIRED)
✅ postcss.config.js      (PostCSS config - REQUIRED)
✅ index.html             (Entry HTML - REQUIRED)
✅ vercel.json            (Vercel config - REQUIRED for deployment)
✅ .gitignore             (Git ignore rules - REQUIRED)
✅ .vercelignore          (Vercel ignore rules - OPTIONAL)
✅ eslint.config.js       (ESLint config - OPTIONAL)
✅ README.md              (Documentation - OPTIONAL)
✅ DEPLOY.md              (Deployment guide - OPTIONAL)
✅ LUTE_WALLET_SETUP.md   (Wallet setup guide - OPTIONAL)
```

---

## ❌ FILES TO EXCLUDE (Auto-ignored by .gitignore)

### 🚫 **DO NOT Commit These:**
```
❌ node_modules/          (Dependencies - will be installed by Vercel)
❌ dist/                  (Build output - Vercel will build automatically)
❌ bounty-frontend@0.0.0  (Temporary file)
❌ tsc                    (Temporary file)
❌ *.log                  (Log files)
❌ .vercel/               (Vercel deployment cache)
```

**Why exclude these?**
- `node_modules/` - Too large (100+ MB), Vercel installs automatically
- `dist/` - Vercel builds this from source code
- Temporary files - Not needed for deployment

---

## 📋 STEP-BY-STEP: Commit to GitHub

### 1. **Clean Up Temporary Files**
Delete these files from your project folder if they exist:
- `bounty-frontend@0.0.0`
- `tsc`

### 2. **Verify .gitignore**
Your `.gitignore` should already have:
```gitignore
node_modules
dist
*.local
.vercel
```

### 3. **GitHub Desktop Commit**

**What you should see in GitHub Desktop:**

✅ **Files to Stage/Commit:**
```
Modified/New files:
├── src/
│   ├── components/
│   ├── pages/
│   ├── WalletProvider.tsx
│   ├── frontend-integration.ts
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── contract.json
├── public/ (if you have any files)
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── vercel.json
├── .gitignore
└── (other config files)
```

❌ **You should NOT see:**
```
node_modules/
dist/
```

If you see these, your `.gitignore` is not working. Make sure it's saved properly.

### 4. **Commit Message**
```
Initial commit: BountyBoard Algorand dApp

- Smart contract integration (App ID: 741636419)
- Pera Wallet connection via WalletConnect
- Task board, creation, and management features
- Full lifecycle: create → claim → submit → approve/reject
- Production-ready build configuration
```

### 5. **Push to GitHub**

**Option A: GitHub Desktop**
1. Select all files (except node_modules and dist)
2. Write commit message
3. Click "Commit to main"
4. Click "Push origin"

**Option B: GitHub.com Upload**
1. Create new repo on GitHub
2. Click "uploading an existing file"
3. Drag and drop ALL files/folders (except node_modules and dist)
4. Write commit message
5. Click "Commit changes"

---

## 🚀 After Pushing to GitHub

### **Deploy on Vercel:**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Vercel auto-detects:
   - ✅ Framework: Vite
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist`
5. Click "Deploy"
6. Wait 2-3 minutes ⏳
7. Get your live URL! 🎉

---

## 📊 Quick Checklist

Before committing to GitHub:

- [ ] `src/` folder exists with all components
- [ ] `src/contract.json` exists (App ID: 741636419)
- [ ] `package.json` and `package-lock.json` exist
- [ ] `vercel.json` configuration exists
- [ ] `.gitignore` properly excludes `node_modules` and `dist`
- [ ] No `node_modules/` folder in commit
- [ ] No `dist/` folder in commit
- [ ] All TypeScript configs included
- [ ] Build files (vite.config.ts, etc.) included

---

## 🎯 Summary

**Commit:**
- ✅ Source code (`src/`)
- ✅ Config files (`package.json`, `vite.config.ts`, etc.)
- ✅ Documentation files (optional)

**Don't Commit:**
- ❌ `node_modules/` (too large)
- ❌ `dist/` (built by Vercel)
- ❌ Temporary files

**After Push:**
- 🚀 Import to Vercel from GitHub
- ⏳ Wait for automatic build
- 🎉 Get live URL!

---

**Your BountyBoard dApp will be live in ~3 minutes after GitHub push!** 🚀
