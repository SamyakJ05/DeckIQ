# Rate Limiting Fix - Test Instructions

## Prerequisites
1. Ensure Next.js dev server is running: `npm run dev`
2. Have a test PDF file ready (preferably with 10+ slides)

## Test Methods

### Method 1: PowerShell Script (Windows - Recommended)
```powershell
.\test-rate-limit.ps1 path\to\your\test.pdf
```

### Method 2: Bash Script (Linux/Mac)
```bash
chmod +x test-rate-limit.sh
./test-rate-limit.sh path/to/your/test.pdf
```

### Method 3: Manual curl (Any OS)
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "file=@path/to/your/test.pdf" \
  -H "Content-Type: multipart/form-data" \
  -o response.json
```

### Method 4: REST Client (VS Code Extension)
1. Install "REST Client" extension in VS Code
2. Open `test-rate-limit.http`
3. Update the file path to your test PDF
4. Click "Send Request" above the POST line

## What to Check

### ✅ Success Indicators:
1. **No 429 errors** in `.bob/log.md`
2. **No 404 errors** in `.bob/log.md`
3. **Sequential processing** visible in logs:
   - NLU calls happen one at a time
   - Granite calls happen one at a time
4. **Timing**: ~16 seconds for 16 slides (8s NLU + 8s Granite)
5. **HTTP 200** response with valid JSON

### ❌ Failure Indicators:
1. `429 Too Many Requests` errors in logs
2. `404 Not Found` errors (invalid model)
3. Multiple API calls happening simultaneously
4. Request completes too quickly (<5 seconds for 16 slides)

## Log Analysis

After running the test, check `.bob/log.md`:

```bash
# Check for errors
grep -E "(429|404|error)" .bob/log.md

# Check timing of API calls
grep -E "(Calling Granite|Calling NLU)" .bob/log.md

# Check success counts
grep -E "(complete|successCount)" .bob/log.md
```

## Expected Log Pattern

You should see logs like this (sequential, not parallel):

```json
{"level":"info","message":"Starting NLU analysis","timestamp":"...","context":{"slideCount":16}}
{"level":"info","message":"Calling NLU for slide 1","timestamp":"..."}
{"level":"info","message":"Calling NLU for slide 2","timestamp":"..."} // 500ms later
{"level":"info","message":"Calling NLU for slide 3","timestamp":"..."} // 500ms later
...
{"level":"info","message":"NLU analysis complete","timestamp":"...","context":{"successCount":16}}

{"level":"info","message":"Starting Granite rubric scoring","timestamp":"..."}
{"level":"info","message":"Calling Granite model","timestamp":"..."}
{"level":"info","message":"Calling Granite model","timestamp":"..."} // 500ms later
...
{"level":"info","message":"Granite rubric scoring complete","timestamp":"...","context":{"successCount":16}}
```

## Troubleshooting

### If you still see 429 errors:
1. Verify the code changes were saved
2. Restart the Next.js dev server
3. Check that both NLU and Granite are using sequential processing
4. Verify the 500ms delay is present in both clients

### If you see 404 errors:
1. Check `.env` file has correct fallback model: `GRANITE_FALLBACK_MODEL=ibm/granite-3-8b-instruct`
2. Restart the server after changing `.env`

### If the test hangs:
1. Check server logs for errors
2. Verify API credentials in `.env` are valid
3. Check network connectivity to IBM Cloud services