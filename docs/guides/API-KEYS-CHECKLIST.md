# 📋 QUICK REFERENCE CARD - API Keys Checklist

Print this or keep it open while you work!

---

## 🎯 YOUR 9 VARIABLES

Copy this list and fill in as you go:

```
✅ DONE | KEY NAME                          | WHERE TO GET IT
--------+------------------------------------+---------------------------
[ ]     | VITE_SQUARE_APPLICATION_ID        | developer.squareup.com/apps → Sandbox tab
[ ]     | VITE_SQUARE_APPLICATION_ID (prod) | developer.squareup.com/apps → Production tab
[ ]     | VITE_SQUARE_LOCATION_ID           | Same page → Locations section (Sandbox)
[ ]     | VITE_SQUARE_LOCATION_ID (prod)    | Same page → Locations section (Production)
[ ]     | VITE_LITEAPI_KEY                  | liteapi.travel → Dashboard → API Keys
[ ]     | VITE_OPENAI_API_KEY               | platform.openai.com/api-keys → Create new
[ ]     | VITE_API_URL                      | railway.app → Your project → Domain
[ ]     | JWT_SECRET                        | Generate yourself (PowerShell command below)
[ ]     | SESSION_SECRET                    | Generate yourself (different from JWT!)
```

---

## 🔐 GENERATE SECRETS (PowerShell)

```powershell
# Run this TWICE to get two different secrets:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**First output =** JWT_SECRET  
**Second output =** SESSION_SECRET

---

## 🔗 QUICK LINKS

**Square:** https://developer.squareup.com/apps  
**LiteAPI:** https://www.liteapi.travel/  
**OpenAI:** https://platform.openai.com/api-keys  
**Railway:** https://railway.app/dashboard  
**Netlify Env:** https://app.netlify.com/projects/vibe-booking-prod/settings/env

---

## ⚙️ NETLIFY SETTINGS FOR EACH VARIABLE

**For all variables:**
- Scopes: **All scopes** ✓
- Context: **All contexts** ✓ (unless specified below)

**Exceptions (use different values per context):**

**VITE_SQUARE_APPLICATION_ID:**
- Deploy previews: sandbox-sq0idb-XXXX
- Production: sq0idp-XXXX

**VITE_SQUARE_LOCATION_ID:**
- Deploy previews: LXXXX (sandbox)
- Production: LXXXX (production)

---

## 🧪 TESTING SQUARE (Sandbox Mode)

**Test Card Numbers:**
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **CVV:** Any 3 digits (e.g., 123)
- **Expiry:** Any future date (e.g., 12/25)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## ✅ VERIFICATION CHECKLIST

After adding all variables:

1. [ ] Trigger new deploy in Netlify
2. [ ] Deploy succeeded (no env errors)
3. [ ] Site loads at https://vibe-booking-prod.netlify.app
4. [ ] Search works (try searching for "hotel")
5. [ ] AI search responds
6. [ ] Test payment with 4111 1111 1111 1111
7. [ ] No console errors (F12 → Console tab)

---

## 💡 PRO TIPS

- **Save secrets immediately** - OpenAI keys can't be viewed again
- **Use password manager** - Store all keys safely
- **Test in sandbox first** - Don't use production keys until tested
- **Set OpenAI limits** - Prevent surprise charges ($10-20/month)
- **Monitor costs** - Check usage weekly in each dashboard

---

## 🆘 QUICK TROUBLESHOOTING

**Variable not working?**
- Check for spaces before/after key
- Verify correct context (Production vs Deploy preview)
- Redeploy after changing variables

**Payment failing?**
- Using sandbox credentials in test?
- Using test card number (4111...)?
- Check Square dashboard for error details

**Search not working?**
- LiteAPI key correct?
- Check browser console for errors
- Verify free tier limits not exceeded

---

**Total Time: 15-20 minutes**  
**Difficulty: Easy - just copy/paste!**  
**Full guide: C:\dev\GET-API-KEYS-WALKTHROUGH.md**

---

Need help? See GET-API-KEYS-WALKTHROUGH.md for detailed step-by-step instructions!
