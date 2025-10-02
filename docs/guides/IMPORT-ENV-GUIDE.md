# 🚀 IMPORT ENVIRONMENT VARIABLES TO NETLIFY (30 SECONDS!)

You're right - importing is WAY faster than adding manually!

## 📂 FILES CREATED:

1. `.env.production` - For your live site (real payments)
2. `.env.sandbox` - For testing (sandbox payments)

Both files are in: `C:\dev\`

---

## 🎯 HOW TO IMPORT (2 steps)

### **STEP 1: Import Production Variables**

1. You're already here: https://app.netlify.com/sites/vibe-booking-prod/settings/env
2. Look for **"Import from .env file"** button (usually near "Add a variable")
3. Click it
4. Select file: `C:\dev\.env.production`
5. Choose context: **Production** ✓
6. Choose scopes: **All scopes** ✓
7. Click **"Import variables"**

---

### **STEP 2: Import Sandbox Variables**

1. Click **"Import from .env file"** again
2. Select file: `C:\dev\.env.sandbox`
3. Choose context: **Deploy previews** ✓
4. Choose scopes: **All scopes** ✓
5. Click **"Import variables"**

---

## ✅ DONE!

That's it! Two imports and all your variables are configured!

The import will:
- ✅ Add new variables (JWT_SECRET, SESSION_SECRET, etc.)
- ✅ Update existing variables (VITE_LITEAPI_KEY, etc.)
- ✅ Set correct values for each context (prod vs sandbox)

---

## 🚀 AFTER IMPORT:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-3 minutes
4. Test: https://vibe-booking-prod.netlify.app

---

## 🧪 TEST CHECKLIST:

After deploy:
- [ ] Site loads without errors
- [ ] Search for a hotel (tests LiteAPI)
- [ ] Try AI search (tests DeepSeek)
- [ ] Test payment with: 4111 1111 1111 1111 (tests Square)
  - Use any future date for expiry
  - Any 3 digits for CVV
  - Any 5 digits for ZIP

---

## 💡 WHY TWO FILES?

**Production (.env.production):**
- Real Square payment credentials
- Real money transactions
- Used on your live site

**Sandbox (.env.sandbox):**
- Square sandbox credentials
- Fake money for testing
- Used in deploy previews (PRs, branches)

This way you can test safely without real charges!

---

**Time to import: 30 seconds**
**Total time saved: 4.5 minutes** 🎉

You were totally right - import is the way to go!
