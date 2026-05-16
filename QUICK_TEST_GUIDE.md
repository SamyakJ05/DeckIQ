# Quick Test Guide - Rate Limiting Fix

## Step-by-Step Manual Test

### 1. Start the Development Server
```powershell
cd DeckIQ
npm run dev
```
Wait for: `✓ Ready on http://localhost:3000`

### 2. Run the Test Script
Open a **new terminal** and run:
```powershell
cd DeckIQ
.\test-rate-limit.ps1 "C:\Users\Saksham Tripathi\Desktop\saksham_resume_ubs (2).pdf"
```

### 3. What You Should See

**✅ SUCCESS Output:**
```
Testing rate limiting with file: ...
Starting test at: ...
Sending request...
Test completed at: ...
Total duration: ~16s
HTTP Status: 200

Checking logs for rate limit errors...
✅ PASSED: No 429 rate limit errors found
✅ PASSED: No 404 model errors found

Response saved to: response.json
```

**❌ FAILURE Output (if fix didn't work):**
```
❌ FAILED: Found 429 rate limit errors in logs
{"level":"error","message":"Granite API error","timestamp":"...","context":{"status":429...
```

### 4. Verify the Logs

Check `.bob/log.md` for sequential processing:
```powershell
# Should show calls happening one at a time, not all at once
Select-String -Path ".bob/log.md" -Pattern "Calling (Granite|NLU)" | Select-Object -First 20
```

**Good Pattern (Sequential):**
```
14:43:02 - Calling NLU for slide 1
14:43:02 - Calling NLU for slide 2  (500ms later)
14:43:03 - Calling NLU for slide 3  (500ms later)
...
14:43:10 - Calling Granite model
14:43:11 - Calling Granite model    (500ms later)
```

**Bad Pattern (Parallel - means fix didn't work):**
```
14:43:02 - Calling NLU for slide 1
14:43:02 - Calling NLU for slide 2  (same time!)
14:43:02 - Calling NLU for slide 3  (same time!)
```

### 5. Check for Errors
```powershell
# Should return nothing (no errors)
Select-String -Path ".bob/log.md" -Pattern "(429|404)" 
```

### 6. View the Response
```powershell
# Should show analysis results
Get-Content response.json | ConvertFrom-Json | Select-Object overallScore, verdict
```

## Alternative: Simple curl Test

If the PowerShell script has issues, use curl:
```powershell
curl -X POST http://localhost:3000/api/analyze `
  -F "file=@C:\Users\Saksham Tripathi\Desktop\saksham_resume_ubs (2).pdf" `
  -o response.json

# Then check logs
Select-String -Path ".bob/log.md" -Pattern "(429|404|error)"
```

## Troubleshooting

### Server won't start
```powershell
# Kill any existing node processes
Get-Process -Name node | Stop-Process -Force
# Try again
npm run dev
```

### Still seeing 429 errors
1. Verify changes were saved (check file timestamps)
2. Restart the dev server (Ctrl+C, then `npm run dev`)
3. Clear the log: `Clear-Content .bob/log.md`
4. Run test again

### Test script fails
Use the manual curl command above instead

## Expected Timeline
- **NLU Analysis**: ~8 seconds for 16 slides (500ms × 16)
- **Granite Scoring**: ~8 seconds for 16 slides (500ms × 16)
- **Total**: ~16-20 seconds (includes processing time)

## Success Criteria
✅ No 429 errors in logs
✅ No 404 errors in logs  
✅ HTTP 200 response
✅ Valid JSON with analysis results
✅ Sequential API calls (visible in logs)