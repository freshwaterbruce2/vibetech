# DIRECTORY RULE - DIGITAL CONTENT BUILDER

## 🚨 CRITICAL RULE: ALWAYS VERIFY DIRECTORY BEFORE COMMANDS

**Current Working Directory MUST BE:**
```
C:\dev\projects\active\web-apps\digital-content-builder
```

## Directory Verification Commands (MANDATORY BEFORE ANY ACTION):

### 1. Check Current Directory
```powershell
pwd
```

### 2. Navigate to Correct Directory (if needed)
```powershell
cd C:\dev\projects\active\web-apps\digital-content-builder
```

### 3. Verify You're in the Right Place
```powershell
ls package.json server.js
```

## Expected Files in Correct Directory:
- ✅ `package.json` (digital-content-builder project)
- ✅ `server.js` (main application file)
- ✅ `.env` (environment variables)
- ✅ `node_modules/` (dependencies)

## Commands That MUST Be Run From This Directory:
- `npm start`
- `npm run dev`
- `npm run test`
- `npm run lint`
- `node server.js`

## ⚠️ WARNING SIGNS (Wrong Directory):
- Running `npm run dev` starts Vite instead of nodemon
- Getting workspace-level commands instead of project-specific
- Missing project files when running `ls`

## RULE ENFORCEMENT:
**ALWAYS run `pwd` before ANY npm command or server operation!**
