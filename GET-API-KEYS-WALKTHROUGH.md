# 🎬 VISUAL WALKTHROUGH - Get Your API Keys (15 Minutes)

Follow this step-by-step guide to get ALL your environment variables.

---

## ✅ CHECKLIST - Track Your Progress

- [ ] Square Payment credentials
- [ ] LiteAPI key
- [ ] OpenAI API key  
- [ ] Railway backend URL (verify)
- [ ] Generate JWT secrets
- [ ] Add all to Netlify

---

## 🟦 SERVICE 1: Square Payment (5 minutes)

### What You're Getting:
- `VITE_SQUARE_APPLICATION_ID`
- `VITE_SQUARE_LOCATION_ID`

### Step-by-Step:

**1. Go to Square Developer Portal:**
```
https://developer.squareup.com/apps
```

**2. Sign In or Create Account**
- Use your email
- Free to create developer account

**3. Create or Select Your App**
- If you don't have an app: Click "+" (Create new application)
- Name it: "Vibe Booking Platform"
- Click "Create"

**4. Get SANDBOX Credentials (for testing):**
- You'll see tabs: "Overview" | "Sandbox" | "Production"
- Click **"Sandbox"** tab
- Find **"Application ID"**: Copy it
  - Looks like: `sandbox-sq0idb-XXXXXXXXXX`
- Scroll down to **"Locations"** section
- Copy **"Location ID"** 
  - Looks like: `LXXXXXXXXXX`

**5. Get PRODUCTION Credentials (for live site):**
- Click **"Production"** tab
- Find **"Application ID"**: Copy it
  - Looks like: `sq0idp-XXXXXXXXXX` (NO "sandbox" prefix)
- Copy **"Location ID"** for production

**6. Save Both Sets:**
```
SANDBOX (for Deploy Previews):
VITE_SQUARE_APPLICATION_ID=sandbox-sq0idb-XXXXXXXXXX
VITE_SQUARE_LOCATION_ID=LXXXXXXXXXX

PRODUCTION (for Live Site):
VITE_SQUARE_APPLICATION_ID=sq0idp-XXXXXXXXXX
VITE_SQUARE_LOCATION_ID=LXXXXXXXXXX
```

✅ **Done with Square!**

---

## 🟧 SERVICE 2: LiteAPI (Hotel Data) (3 minutes)

### What You're Getting:
- `VITE_LITEAPI_KEY`

### Step-by-Step:

**1. Go to LiteAPI:**
```
https://www.liteapi.travel/
```

**2. Sign Up:**
- Click "Get Started" or "Sign Up"
- Enter your email
- Verify email
- Complete registration

**3. Go to Dashboard:**
- After login, you'll see your dashboard
- Look for "API Keys" or "Credentials" section

**4. Copy Your API Key:**
- Should be visible on dashboard
- Looks like: `lit_XXXXXXXXXXXXXXXXXXXX`
- Click "Copy" or select and copy

**5. Check Your Plan:**
- Free tier usually: 100-1000 requests/month
- Should be fine for testing
- Can upgrade later if needed

**6. Save It:**
```
VITE_LITEAPI_KEY=lit_XXXXXXXXXXXXXXXXXXXX
```

✅ **Done with LiteAPI!**

---

## 🟩 SERVICE 3: OpenAI (AI Search) (3 minutes)

### What You're Getting:
- `VITE_OPENAI_API_KEY`

### Step-by-Step:

**1. Go to OpenAI Platform:**
```
https://platform.openai.com/api-keys
```

**2. Sign In or Create Account:**
- If you don't have an account, click "Sign up"
- Can use Google/Microsoft sign-in
- Complete verification

**3. Add Billing (Required):**
- Go to: Settings > Billing
- Add credit card
- Set spending limit (recommend $10-20/month to start)

**4. Create API Key:**
- Go to: API Keys section
- Click "+ Create new secret key"
- Name it: "Vibe Booking Production"
- Permissions: "All" (default)
- Click "Create secret key"

**5. COPY IT IMMEDIATELY:**
- ⚠️ **IMPORTANT:** You can only see it once!
- Starts with: `sk-proj-` or `sk-`
- Click "Copy" button
- Paste it somewhere safe immediately

**6. Save It:**
```
VITE_OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**7. Set Usage Limits (Recommended):**
- Go to: Settings > Limits
- Set "Hard limit": $20/month (adjust as needed)
- Set "Soft limit": $10/month
- This prevents surprise charges

✅ **Done with OpenAI!**

---

## 🟪 SERVICE 4: Railway Backend (1 minute)

### What You're Getting:
- `VITE_API_URL`

### You Already Have This!

Your current value: `https://airy-passion-production.up.railway.app`

**Just verify it's correct:**

**1. Go to Railway:**
```
https://railway.app/dashboard
```

**2. Find Your Project:**
- Look for "airy-passion-production"
- Click on it

**3. Check the URL:**
- Click on your service
- Look for "Deployments" section
- Should show the domain

**4. If URL is different:**
- Copy the correct URL from Railway
- Use that instead

**5. Save It:**
```
VITE_API_URL=https://airy-passion-production.up.railway.app
```

✅ **Done with Railway!**

---

## 🔐 SERVICE 5: Security Secrets (2 minutes)

### What You're Getting:
- `JWT_SECRET`
- `SESSION_SECRET`

### Generate Them Yourself:

**1. Open PowerShell** (Windows Key + X → PowerShell)

**2. Run This Command TWICE:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**3. First Run Output (Example):**
```
k3J9mQ2pL7xN4vR8wT1yH6bF5aS0dG9z
```
This is your `JWT_SECRET`

**4. Second Run Output (Example):**
```
n7M4pQ9sL2xR6vT8wH1yK5bG3aF0dC7z
```
This is your `SESSION_SECRET`

**5. Save Both:**
```
JWT_SECRET=k3J9mQ2pL7xN4vR8wT1yH6bF5aS0dG9z
SESSION_SECRET=n7M4pQ9sL2xR6vT8wH1yK5bG3aF0dC7z
```

**Important:** These should be DIFFERENT from each other!

✅ **Done with Secrets!**

---

## 📥 ADD EVERYTHING TO NETLIFY (5 minutes)

Now let's add all 8 variables to Netlify!

### Step-by-Step:

**1. Open Netlify Environment Variables:**
```
https://app.netlify.com/projects/vibe-booking-prod/settings/env
```

**2. Click "Add a variable"**

**3. Add Each Variable:**

### Variable 1: Square Application ID (Sandbox)
```
Key: VITE_SQUARE_APPLICATION_ID
Value: [Your sandbox app ID from Square]
Scopes: All scopes ✓
Context: Deploy previews ✓
```
Click "Create variable"

### Variable 2: Square Application ID (Production)
Click "Edit" on the variable you just created
Click "Add another value"
```
Value: [Your production app ID from Square]
Context: Production ✓
```
Click "Save"

### Variable 3: Square Location ID (Sandbox)
```
Key: VITE_SQUARE_LOCATION_ID
Value: [Your sandbox location ID from Square]
Scopes: All scopes ✓
Context: Deploy previews ✓
```
Click "Create variable"

### Variable 4: Square Location ID (Production)
Click "Edit" on VITE_SQUARE_LOCATION_ID
Click "Add another value"
```
Value: [Your production location ID from Square]
Context: Production ✓
```
Click "Save"

### Variable 5: LiteAPI Key
```
Key: VITE_LITEAPI_KEY
Value: [Your LiteAPI key]
Scopes: All scopes ✓
Context: All contexts ✓
```
Click "Create variable"

### Variable 6: OpenAI API Key
```
Key: VITE_OPENAI_API_KEY
Value: [Your OpenAI key starting with sk-]
Scopes: All scopes ✓
Context: All contexts ✓
```
Click "Create variable"

### Variable 7: API URL
```
Key: VITE_API_URL
Value: https://airy-passion-production.up.railway.app
Scopes: All scopes ✓
Context: All contexts ✓
```
Click "Create variable"

### Variable 8: JWT Secret
```
Key: JWT_SECRET
Value: [Your first generated secret]
Scopes: All scopes ✓
Context: All contexts ✓
```
Click "Create variable"

### Variable 9: Session Secret
```
Key: SESSION_SECRET
Value: [Your second generated secret]
Scopes: All scopes ✓
Context: All contexts ✓
```
Click "Create variable"

### Optional Development Flags:

If you want to enable debug mode for previews:

```
Key: VITE_ENABLE_DEBUG
Value: true
Scopes: All scopes ✓
Context: Deploy previews ✓
```

```
Key: VITE_ENABLE_DEBUG
Value: false
Scopes: All scopes ✓
Context: Production ✓
```

```
Key: VITE_ENABLE_MOCK_PAYMENTS
Value: true
Scopes: All scopes ✓
Context: Deploy previews ✓
```

```
Key: VITE_ENABLE_MOCK_PAYMENTS
Value: false
Scopes: All scopes ✓
Context: Production ✓
```

✅ **ALL VARIABLES ADDED!**

---

## 🧪 TEST YOUR SETUP (3 minutes)

### 1. Trigger a New Deploy:
```
https://app.netlify.com/projects/vibe-booking-prod/deploys
```
- Click "Trigger deploy" → "Deploy site"
- Wait 2-3 minutes for deploy to complete

### 2. Check Deploy Log:
- Click on the deploy that's running
- Look for "Deploy succeeded" ✓
- No errors about missing env variables

### 3. Test Your Site:
```
https://vibe-booking-prod.netlify.app
```
- Site should load
- Try searching for a hotel
- Try making a test booking with Square sandbox

### 4. Check Browser Console:
- Press F12 to open DevTools
- Go to Console tab
- Should see no errors about missing API keys

---

## ✅ FINAL CHECKLIST

Verify everything is working:

- [ ] Site loads without errors
- [ ] Search works (LiteAPI is responding)
- [ ] AI search works (OpenAI is responding)
- [ ] Test payment flow works (Square sandbox)
- [ ] No console errors about missing variables
- [ ] Deploy previews work with sandbox credentials
- [ ] Production uses live credentials

---

## 🎉 SUCCESS!

You now have:
- ✅ All API keys configured
- ✅ Separate test/production environments
- ✅ Secure secrets generated
- ✅ Environment variables in Netlify
- ✅ Working booking platform

---

## 💰 COST BREAKDOWN

**Free:**
- Netlify hosting
- Square sandbox (testing)
- GitHub repository

**Paid (Monthly):**
- Railway: ~$5-10 (backend hosting)
- LiteAPI: $0-50 (depends on searches)
- OpenAI: $10-50 (depends on AI usage)
- Square fees: 2.9% + 30¢ per transaction (production only)

**Total estimated:** $15-60/month to start

**Tips to reduce costs:**
- Set OpenAI spending limits
- Use caching for hotel searches
- Monitor usage regularly
- Start with free tiers

---

## 🆘 TROUBLESHOOTING

### "Square payment declined"
- Check you're using sandbox credentials in test
- Verify card number: Use Square test cards
  - Success: 4111 1111 1111 1111
  - Failure: 4000 0000 0000 0002

### "LiteAPI 401 Unauthorized"
- API key might be wrong
- Check for extra spaces when copying
- Verify key is active in LiteAPI dashboard

### "OpenAI rate limit exceeded"
- Check usage in OpenAI dashboard
- Increase spending limit if needed
- Consider caching AI responses

### "Backend API not responding"
- Check Railway service is running
- Verify URL has no trailing slash
- Check Railway logs for errors

---

## 📞 WHERE TO GET HELP

**Square:**
- Docs: https://developer.squareup.com/docs
- Forum: https://developer.squareup.com/forums

**LiteAPI:**
- Docs: https://docs.liteapi.travel
- Support: support@liteapi.travel

**OpenAI:**
- Docs: https://platform.openai.com/docs
- Help: https://help.openai.com

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Netlify:**
- Docs: https://docs.netlify.com
- Support: https://answers.netlify.com

---

**NEXT:** After everything is working, move on to Step 3 in QUICK-START-SECURITY.md!

🚀 You're crushing it!
