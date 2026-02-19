# 🚀 Quick Start - Deploy BountyBoard to Vercel

## 📦 What to Commit to GitHub

### ✅ YES - Commit These:

```
bounty-frontend/
├── src/                          👈 ALL YOUR CODE (REQUIRED)
│   ├── components/
│   ├── pages/
│   ├── WalletProvider.tsx
│   ├── frontend-integration.ts
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── contract.json            👈 Contract info (REQUIRED)
│
├── public/                       👈 If you have files here
│
├── package.json                  👈 REQUIRED
├── package-lock.json             👈 REQUIRED
├── vite.config.ts                👈 REQUIRED
├── tsconfig.json                 👈 REQUIRED
├── tsconfig.app.json             👈 REQUIRED
├── tsconfig.node.json            👈 REQUIRED
├── tailwind.config.js            👈 REQUIRED
├── postcss.config.js             👈 REQUIRED
├── index.html                    👈 REQUIRED
├── vercel.json                   👈 REQUIRED for Vercel
├── .gitignore                    👈 REQUIRED
├── .vercelignore
├── eslint.config.js
├── README.md
├── DEPLOY.md
└── GITHUB_COMMIT_GUIDE.md
```

**Total Size:** ~2-5 MB

---

### ❌ NO - Don't Commit These:

```
❌ node_modules/     (100+ MB - Too large, Vercel installs it)
❌ dist/             (Build output - Vercel builds it automatically)
❌ .vercel/          (Deployment cache)
```

**Why?**
- Vercel will run `npm install` automatically (installs node_modules)
- Vercel will run `npm run build` automatically (creates dist folder)

---

## 🎯 Simple Steps

### 1️⃣ **Using GitHub Desktop:**

1. Open GitHub Desktop
2. Select `bounty-frontend` folder
3. You should see ~20-30 files
4. **Make sure you DON'T see:**
   - ❌ node_modules folder
   - ❌ dist folder
5. Write commit message: `Initial commit: BountyBoard dApp`
6. Click "Commit to main"
7. Click "Push origin"

### 2️⃣ **Using GitHub.com:**

1. Create new repo on GitHub
2. Click "uploading an existing file"
3. Open `bounty-frontend` folder
4. Select ALL files EXCEPT:
   - ❌ node_modules folder
   - ❌ dist folder
5. Drag & drop to GitHub
6. Click "Commit changes"

---

## 🚀 Deploy on Vercel

### **After GitHub Push:**

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Sign in with GitHub
4. Select **your repository**
5. Vercel auto-detects everything ✨
6. Click **"Deploy"**
7. Wait **2-3 minutes** ⏳
8. **Done!** Get your live URL 🎉

**Your URL will look like:**
```
https://bounty-board-xyz.vercel.app
```

---

## ✅ Verification

### **Before Committing:**

```bash
# Check what you're committing (in terminal)
cd bounty-frontend
git status

# You should see:
# - src/ folder and files ✅
# - config files ✅
# - NO node_modules ✅
# - NO dist ✅
```

### **After Deployment:**

1. Open your Vercel URL
2. Click "Connect Pera Wallet"
3. Try creating a test task
4. If it works → SUCCESS! 🎉

---

## 📊 Summary

| What | Size | Action |
|------|------|--------|
| Your code (`src/`) | ~500 KB | ✅ Commit |
| Config files | ~50 KB | ✅ Commit |
| `node_modules/` | 100+ MB | ❌ Don't commit |
| `dist/` | 2 MB | ❌ Don't commit |

**Vercel will:**
- ✅ Install dependencies (`npm install`)
- ✅ Build your app (`npm run build`)
- ✅ Deploy to live URL
- ✅ Auto-deploy on every push

---

## 🆘 Troubleshooting

**Q: I see node_modules in my commit!**
**A:** Your `.gitignore` is not working. Make sure:
- File is named exactly `.gitignore` (with the dot)
- Contains `node_modules` on a line
- File is saved

**Q: Build fails on Vercel**
**A:** Check Vercel logs:
1. Go to your project on Vercel
2. Click "Deployments"
3. Click failed deployment
4. Read error message

**Q: Page shows 404 on refresh**
**A:** Already fixed! `vercel.json` has SPA routing configured

---

## 🎉 That's It!

**3 Simple Steps:**
1. ✅ Commit to GitHub (without node_modules & dist)
2. ✅ Import to Vercel
3. ✅ Get live URL

**Your BountyBoard dApp will be live in 3 minutes!** 🚀

---

**Need detailed help?** See `GITHUB_COMMIT_GUIDE.md`
