# File Upload Debugging Guide

## Upload Flow

1. **Frontend calls `/api/objects/upload` (POST)**
   - Purpose: Get upload parameters (URL, method, headers)
   - Returns: `{ uploadURL: "/api/objects/store", method: "PUT", headers: {...} }`
   - This does NOT upload the file, just prepares the upload

2. **Frontend uploads file to `/api/objects/store?filename=...` (PUT)**
   - This is where the actual file upload happens
   - File is sent as raw binary in the request body
   - Server saves it to `uploads/` directory

## What to Check

### 1. Check Server Logs

When you upload a file, you should see these logs in order:

```
🔵 PUT /api/objects/store - Request received
📁 ========== Raw file upload (PUT) handler called ==========
📁 Content-Type: image/png (or whatever)
📁 Content-Length: [file size in bytes]
📁 Query params: { filename: 'Screenshot (7).png' }
📁 Request body type: object
📁 Request body is Buffer: true
📁 Request body length: [file size]
📁 File buffer size: [file size] bytes
📁 Original filename: Screenshot (7).png
📁 Uploads directory: [path]
📁 Saving file to: [full path]
✅ File saved successfully!
📁 File path: [path]
📁 Public URL: /uploads/[timestamp+timezone-filename]
```

### 2. If You Don't See These Logs

**Problem**: Request not reaching the handler
- Check if authentication is failing
- Check if route is registered correctly
- Check browser Network tab for response status

### 3. If You See "Body was parsed as JSON"

**Problem**: Global `express.json()` middleware is consuming the body before `express.raw()` can handle it

**Solution**: The route-specific `express.raw()` should override, but if it doesn't, we need to register the PUT route earlier or exclude it from JSON parsing.

### 4. Check File System

After upload, check if file exists:
```bash
# Windows PowerShell
dir uploads

# Linux/Mac
ls -la uploads/
```

The file should be named like: `1763110450418+0530-Screenshot_7.png`

### 5. Check Browser Network Tab

- PUT request to `/api/objects/store?filename=...`
- Status should be 200
- Response should be JSON with `publicUrl`
- Check Request Payload - should show binary data

## Common Issues

1. **File not saving**: Check write permissions on `uploads/` directory
2. **Empty buffer**: Check if request body is being consumed by another middleware
3. **Authentication failing**: Check if token is valid and being sent
4. **Route not found**: Check if route is registered before other routes that might catch it

## Next Steps

1. Restart your server
2. Try uploading a file
3. Check server console for the logs above
4. Share the logs if the file still doesn't upload

