import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  endpoint?: string;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  endpoint = "/api/objects/store",
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    });

    // Use XHR Upload plugin for simple, reliable multipart/form-data uploads
    uppyInstance.use(XHRUpload, {
      endpoint: endpoint,
      method: "post",
      fieldName: "file",
      formData: true,
      bundle: false,
      // Don't set responseType - let XHRUpload handle it automatically
      // Setting it might interfere with how XHRUpload processes the response
      headers: () => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
      },
      getResponseData: (responseText: string, response?: XMLHttpRequest) => {
        console.log("📁 getResponseData called");
        console.log("📁 Response text parameter:", responseText);
        console.log("📁 Response text type:", typeof responseText);
        console.log("📁 Response text length:", responseText?.length);
        console.log("📁 Response object:", response);
        console.log("📁 Response object keys:", response ? Object.keys(response) : []);
        console.log("📁 Response status:", response?.status);
        console.log("📁 Response type:", response?.responseType);
        console.log("📁 Response URL:", response?.responseURL);
        
        // Log all possible response properties
        if (response) {
          const xhr = response as any;
          console.log("📁 response.responseText:", xhr.responseText);
          console.log("📁 response.response:", xhr.response);
          console.log("📁 response.responseType:", xhr.responseType);
          console.log("📁 response.readyState:", xhr.readyState);
        }
        
        // XHRUpload v4 may pass response differently - check multiple sources
        let parsed: any = {};
        let jsonString = "";
        
        // XHRUpload v4 might pass empty responseText - get it from XMLHttpRequest directly
        // Priority: responseText param > xhr.responseText > xhr.response (string) > xhr.response (object)
        
        if (responseText && typeof responseText === 'string' && responseText.trim().length > 0) {
          jsonString = responseText;
          console.log("✅ Using responseText parameter");
        } else if (response) {
          const xhr = response as XMLHttpRequest;
          
          // Try responseText property (most common)
          if (xhr.responseText && typeof xhr.responseText === 'string' && xhr.responseText.trim().length > 0) {
            jsonString = xhr.responseText;
            console.log("✅ Using XMLHttpRequest.responseText:", xhr.responseText.substring(0, 100));
          }
          // Try response property (for different responseType settings like 'json', 'text', etc.)
          else if (xhr.response !== null && xhr.response !== undefined) {
            if (typeof xhr.response === 'string' && xhr.response.trim().length > 0) {
              jsonString = xhr.response;
              console.log("✅ Using XMLHttpRequest.response (string):", xhr.response.substring(0, 100));
            } else if (typeof xhr.response === 'object') {
              // Already parsed (responseType was 'json')
              parsed = xhr.response;
              console.log("✅ Using XMLHttpRequest.response (object):", parsed);
            }
          }
        }
        
        // Parse JSON string if we have one
        if (jsonString && jsonString.trim().length > 0) {
          try {
            parsed = JSON.parse(jsonString);
            console.log("✅ Successfully parsed JSON response:", parsed);
          } catch (error) {
            console.error("❌ Error parsing JSON:", error);
            console.error("❌ JSON string (first 500 chars):", jsonString.substring(0, 500));
          }
        }
        
        // Final check - if still no data, log everything for debugging
        if (!parsed || Object.keys(parsed).length === 0) {
          console.error("❌ CRITICAL: No response data found after all attempts!");
          console.error("❌ responseText parameter:", responseText);
          if (response) {
            const xhr = response as any;
            console.error("❌ xhr.responseText:", xhr.responseText);
            console.error("❌ xhr.response:", xhr.response);
            console.error("❌ xhr.responseType:", xhr.responseType);
            console.error("❌ xhr.readyState:", xhr.readyState);
            console.error("❌ xhr.status:", xhr.status);
            console.error("❌ xhr.statusText:", xhr.statusText);
          }
        }
        
        // Get status from response object or assume success
        const status = response?.status ?? 200;
        const responseURL = response?.responseURL || "";
        
        // Validate that we have actual data
        if (!parsed || Object.keys(parsed).length === 0 || !parsed.success) {
          console.error("❌ No valid parsed data!", {
            parsed,
            responseText,
            response: response ? {
              status: response.status,
              responseText: (response as any).responseText,
              response: (response as any).response,
            } : null,
          });
        }
        
        // Always return a valid object with required fields
        const responseData = {
          ...parsed,
          success: parsed.success !== false,
          url: parsed.publicUrl || parsed.objectPath || parsed.url || parsed.location || "",
          publicUrl: parsed.publicUrl || parsed.objectPath || parsed.url || parsed.location || "",
          objectPath: parsed.objectPath || parsed.publicUrl || parsed.url || parsed.location || "",
          fileName: parsed.fileName,
          mimeType: parsed.mimeType,
          fileSize: parsed.fileSize,
          status: status,
        };
        
        console.log("📁 Final response data being returned:", responseData);
        
        // Validate that we have at least one path
        if (!responseData.url && !responseData.publicUrl && !responseData.objectPath) {
          console.error("❌ WARNING: No file path in response!", {
            parsed,
            responseData,
            responseText,
          });
        }
        
        return responseData;
      },
      getResponseError: (responseText: string, response?: XMLHttpRequest) => {
        // This should only be called for non-2xx responses
        // BUT: Sometimes XHRUpload calls this even for 2xx if getResponseData throws or returns invalid data
        console.error("📁 getResponseError called");
        console.error("📁 Error response text:", responseText);
        console.error("📁 Response object:", response);
        console.error("📁 Response status:", response?.status);
        
        // Handle case where response might be undefined
        const status = response?.status ?? 0;
        
        // CRITICAL: If status is 2xx, this shouldn't be called, but if it is, don't return an error
        if (status >= 200 && status < 300) {
          console.warn("⚠️ WARNING: getResponseError called for successful response! This is a bug.");
          console.warn("⚠️ Attempting to parse as success response instead...");
          
          try {
            const parsed = JSON.parse(responseText);
            if (parsed.success !== false) {
              // This is actually a success - return undefined to indicate no error
              console.warn("⚠️ Response is actually successful, ignoring error");
              return undefined as any; // Return undefined to indicate no error
            }
          } catch {
            // Can't parse, but status is OK, so don't treat as error
            console.warn("⚠️ Can't parse but status is OK, ignoring error");
            return undefined as any;
          }
        }
        
        // This is a real error (non-2xx status or no status)
        try {
          const parsed = JSON.parse(responseText);
          return new Error(parsed.message || parsed.error || `Upload failed (${status || 'unknown status'})`);
        } catch {
          return new Error(responseText || `Upload failed (${status || 'unknown status'})`);
        }
      },
    });

    uppyInstance.on("complete", (result) => {
      console.log("📁 Upload complete:", result);
      console.log("📁 Successful:", result.successful.length, "Failed:", result.failed.length);
      
      // Log details of failed uploads
      if (result.failed.length > 0) {
        console.error("📁 Failed uploads details:", result.failed.map((f: any) => ({
          name: f.name,
          error: f.error,
          response: f.response,
          status: f.response?.status,
        })));
      }
      
      // Log details of successful uploads
      if (result.successful.length > 0) {
        console.log("📁 Successful uploads details:", result.successful.map((f: any) => ({
          name: f.name,
          response: f.response,
          body: f.response?.body,
        })));
      }
      
      onComplete?.(result);
    });

    uppyInstance.on("upload-error", (file, error, response) => {
      console.error("📁 Upload error event:", file?.name);
      console.error("📁 Error:", error);
      console.error("📁 Response:", response);
      console.error("📁 Response status:", response?.status);
      console.error("📁 Response body:", response?.body);
    });

    uppyInstance.on("upload-success", (file, response) => {
      console.log("📁 Upload success event:", file?.name);
      console.log("📁 Response:", response);
      console.log("📁 Response body:", response?.body);
      console.log("📁 File response:", (file as any).response);
      console.log("📁 File object:", file);
      console.log("📁 File object keys:", Object.keys(file || {}));
      
      // Store the file and response for later access in complete handler
      // This helps us debug and potentially fix empty responses
      (file as any)._uploadResponse = response;
      (file as any)._uploadSuccessTime = Date.now();
    });

    uppyInstance.on("upload", (data) => {
      console.log("📁 Upload started:", data);
    });

    uppyInstance.on("upload-progress", (file, progress) => {
      console.log("📁 Upload progress:", file?.name, progress);
    });

    return uppyInstance;
  });

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}