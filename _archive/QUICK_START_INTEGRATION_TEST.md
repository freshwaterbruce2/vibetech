# 🚀 Quick Start: Test NOVA ↔ Vibe Integration

## ⚡ 3-Minute Integration Test

### Prerequisites ✅

- ✅ **IPC Bridge is RUNNING** on port 5004
- ✅ Shared databases path: `D:\databases\`

---

## Step 1: Start NOVA Agent (1 min)

```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current
npm run dev
```

**Wait for**: "✅ Connected to IPC Bridge"

---

## Step 2: Start Vibe Code Studio (1 min)

```powershell
# Open a new terminal
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev
```

**Wait for**: "NovaAgentBridge: ✅ Connected"

---

## Step 3: Quick Integration Test (30 seconds)

### Test A: Shared Database

**In Vibe Code Studio**:
1. Click **"Learning"** button (bottom status bar)
2. Click **"Add Mistake"** tab
3. Enter:
   - Error: `Test integration mistake`
   - Context: `Testing NOVA-Vibe sync`
   - Solution: `Integration works!`
4. Click **"Log Mistake"**

**In NOVA Agent**:
1. Go to **Insights** → **Learning**
2. Look for the mistake you just added
3. **✅ SUCCESS** if it appears with `source: vibe`

### Test B: IPC Communication

**Check IPC Bridge Terminal**:

You should see:
```
📨 Message: vibe → nova
Type: learning_update
SubType: mistake_logged
✅ Message delivered
```

---

## ✅ Integration Working If:

- [x] Both apps connected to IPC Bridge
- [x] Mistake from Vibe appears in NOVA
- [x] IPC Bridge shows message routing
- [x] No console errors

---

## 🎯 Next: Full Test Suite

See **INTEGRATION_TEST_GUIDE.md** for:
- File opening NOVA → Vibe
- Real-time learning sync
- Activity tracking
- Pattern recognition
- Cross-app recommendations

---

## 🐛 Quick Fixes

**"Cannot connect to IPC Bridge"**:
```bash
# Check if bridge is running
netstat -an | findstr "5004"
```

**"Database locked"**:
- Normal in WAL mode
- Restart both apps if persistent

**NOVA doesn't show Vibe data**:
- Verify: `D:\databases\agent_learning.db` exists
- Check both apps use same path
- Restart apps to refresh

---

## 📊 What's Happening Behind the Scenes

```
Vibe Code Studio
     │
     │ 1. User logs mistake
     │ 2. Save to D:\databases\agent_learning.db
     │ 3. Send IPC message: "mistake_logged"
     │
     ├──► IPC Bridge (Port 5004)
     │         │
     │         │ Route message to NOVA
     │         ▼
     │    NOVA Agent
     │         │
     │         │ 1. Receive IPC message
     │         │ 2. Read from D:\databases\agent_learning.db
     │         │ 3. Update UI (real-time)
     │         ▼
     │    ✅ Mistake appears in NOVA's Learning panel
```

---

**Ready to test!** Both apps will share intelligence, databases, and communicate in real-time. 🎉
