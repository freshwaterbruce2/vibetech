# 🎯 VIBE BOOKING PLATFORM - SIMPLIFIED ENVIRONMENT VARIABLES
# Just the variables YOU actually need!

# ============================================================================
# STEP-BY-STEP: Where to Get Each Variable
# ============================================================================

# ============================================================================
# 1. SQUARE PAYMENTS (Required for bookings)
# ============================================================================

VITE_SQUARE_APPLICATION_ID=sandbox-sq0idb-XXXXXXXXXXXXXXXXXXXXXXXX
VITE_SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXX

# WHERE TO GET THESE:
# 1. Go to: https://developer.squareup.com/apps
# 2. Sign in (or create free account)
# 3. Click on your app (or create new app)
# 4. For TESTING (use these first):
#    - Click "Sandbox" tab
#    - Application ID is shown at top
#    - Location ID: Go to "Locations" section
# 5. For PRODUCTION (switch later):
#    - Click "Production" tab
#    - Get production Application ID
#    - Get production Location ID
#
# IMPORTANT: 
# - Use SANDBOX for testing (Deploy Previews context)
# - Use PRODUCTION for live site (Production context)

# ============================================================================
# 2. HOTEL DATA API (LiteAPI)
# ============================================================================

VITE_LITEAPI_KEY=YOUR_LITEAPI_KEY_HERE

# WHERE TO GET THIS:
# 1. Go to: https://docs.liteapi.travel/
# 2. Click "Get API Key" or "Sign Up"
# 3. Create free account
# 4. Go to Dashboard
# 5. Copy your API key
#
# FREE TIER: Usually includes 100-1000 requests/month
# Upgrade as needed based on usage

# ============================================================================
# 3. AI SEARCH (OpenAI)
# ============================================================================

VITE_OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# WHERE TO GET THIS:
# 1. Go to: https://platform.openai.com/api-keys
# 2. Sign in (or create account)
# 3. Click "Create new secret key"
# 4. Give it a name (e.g., "Vibe Booking Production")
# 5. Copy the key (starts with "sk-proj-")
# 6. SAVE IT IMMEDIATELY - you can't see it again!
#
# COST: Pay-as-you-go
# - GPT-3.5-Turbo: ~$0.0015 per 1K tokens
# - GPT-4: ~$0.03 per 1K tokens
# Set usage limits in OpenAI dashboard to control costs

# ============================================================================
# 4. BACKEND API URL
# ============================================================================

VITE_API_URL=https://airy-passion-production.up.railway.app

# WHAT IS THIS:
# Your Railway backend URL
# 
# WHERE TO GET THIS:
# 1. Go to: https://railway.app/dashboard
# 2. Click on your "airy-passion-production" project
# 3. Click on your service
# 4. Copy the domain under "Deployments"
#
# ALREADY CONFIGURED: Looks like you already have this!
# Just verify it's the correct URL

# ============================================================================
# 5. DEVELOPMENT FLAGS (Optional but useful)
# ============================================================================

VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK_PAYMENTS=false

# WHAT THESE DO:
# - ENABLE_DEBUG: Shows console logs and debug info
# - ENABLE_MOCK_PAYMENTS: Skip real payments for testing
#
# RECOMMENDED SETTINGS:
# - Production context: both false
# - Deploy Preview context: ENABLE_DEBUG=true, MOCK_PAYMENTS=true
# - Local development: both true

# ============================================================================
# 6. SECURITY SECRETS (Generate these yourself)
# ============================================================================

JWT_SECRET=your_random_32_char_secret_here_no_spaces
SESSION_SECRET=another_different_32_char_secret

# WHERE TO GET THESE:
# You generate them yourself! Use this PowerShell command:
#
# In PowerShell:
# -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
#
# Run it TWICE to get two different secrets
# Example output: k3J9mQ2pL7xN4vR8wT1yH6bF5aS0dG9z
#
# IMPORTANT: These should be different from each other!

# ============================================================================
# THAT'S IT! Just these 8 variables.
# ============================================================================

# ============================================================================
# QUICK REFERENCE CARD - WHERE TO ADD THESE IN NETLIFY
# ============================================================================

# Go to: https://app.netlify.com/projects/vibe-booking-prod/settings/env
# Click "Add a variable"

# For EACH variable above:
# 1. Enter Key (e.g., VITE_SQUARE_APPLICATION_ID)
# 2. Enter Value (from the service above)
# 3. Choose scope: "All scopes"
# 4. Choose context:
#    - Production context: Use production/live values
#    - Deploy preview context: Use sandbox/test values
# 5. Click "Create variable"

# ============================================================================
# PRODUCTION vs TESTING
# ============================================================================

# PRODUCTION (Live site - real money!)
# - Square: Production credentials
# - LiteAPI: Production key
# - OpenAI: Production key (with usage limits!)
# - Mock payments: FALSE
# - Debug: FALSE

# DEPLOY PREVIEWS (Testing - safe to play with)
# - Square: Sandbox credentials
# - LiteAPI: Test/sandbox key (if available)
# - OpenAI: Same key (but set lower limits)
# - Mock payments: TRUE
# - Debug: TRUE

# ============================================================================
# ESTIMATED COSTS
# ============================================================================

# FREE:
# - Square Sandbox: Free
# - Netlify hosting: Free (for personal projects)
# - Railway: $5-10/month (backend)

# PAY-AS-YOU-GO:
# - LiteAPI: Free tier, then ~$50/month for 10,000 requests
# - OpenAI: ~$10-50/month depending on usage
# - Square Production: 2.9% + 30¢ per transaction

# Total estimated: $15-60/month to start

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# "Square payment not working"
# - Check you're using SANDBOX in test, PRODUCTION in prod
# - Verify Location ID matches your Application ID
# - Check Square dashboard for transaction logs

# "LiteAPI returning errors"
# - Verify API key is active
# - Check usage limits haven't been exceeded
# - Try test query in their API playground

# "OpenAI not responding"
# - Verify API key starts with "sk-proj-" or "sk-"
# - Check billing is set up in OpenAI dashboard
# - Verify usage limits aren't exceeded

# "Backend API errors"
# - Check Railway service is running
# - Verify the URL is correct (no trailing slash)
# - Check Railway logs for errors

# ============================================================================
# NEXT STEPS AFTER ADDING VARIABLES
# ============================================================================

# 1. Add all variables to Netlify (15 minutes)
# 2. Trigger a redeploy (Settings > Deploys > Trigger deploy)
# 3. Test on production site
# 4. Create a test PR to check deploy preview works
# 5. Make a test booking with Square Sandbox

# ============================================================================
