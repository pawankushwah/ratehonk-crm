import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const CRM_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "CRM",
    subject_token_type: "access_token",
    token_url: `${CRM_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${CRM_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/whatsapp-media/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimetype?: string
  ): Promise<string> {
    try {
      // Try to use Google Cloud Storage if PRIVATE_OBJECT_DIR is set
      try {
        const privateObjectDir = this.getPrivateObjectDir();
        if (privateObjectDir) {
          // Ensure fileName doesn't start with / and construct full path
          const cleanFileName = fileName.startsWith("/") ? fileName.slice(1) : fileName;
          const fullPath = `${privateObjectDir}/${cleanFileName}`;

          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);

          // Upload the buffer to Google Cloud Storage
          await file.save(buffer, {
            metadata: {
              contentType: mimetype || "application/octet-stream",
            },
          });

          // Make the file publicly readable (optional, adjust based on your needs)
          await file.makePublic().catch(() => {
            // Ignore if already public or if making public fails
            console.log(`⚠️ Could not make file public: ${objectName}`);
          });

          // Return the public URL
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
          console.log(`✅ File uploaded to GCS successfully: ${publicUrl}`);
          return publicUrl;
        }
      } catch (gcsError: any) {
        console.log(`⚠️ GCS upload failed, falling back to local storage: ${gcsError.message}`);
      }

      // Fallback to local file system storage
      const uploadsDir = path.join(process.cwd(), "uploads", "email-attachments");
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`📁 Created uploads directory: ${uploadsDir}`);
      }

      // Clean fileName to prevent path traversal
      const cleanFileName = path.basename(fileName);
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeFileName = `${timestamp}-${randomSuffix}-${cleanFileName}`;
      const filePath = path.join(uploadsDir, safeFileName);

      // Write file to local filesystem
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ File saved to local storage: ${filePath}`);

      // Return a URL that can be served by the Express server
      // The server should serve files from /uploads/email-attachments/
      const publicUrl = `/uploads/email-attachments/${safeFileName}`;
      console.log(`✅ File uploaded to local storage successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      console.error(`❌ Error uploading file ${fileName}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${CRM_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on CRM`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
