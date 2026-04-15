import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { fileURLToPath } from "url";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();


/* Helper: reliable __dirname for ESM modules */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/* Helper: root folder of the Vite client (client/) */

function getClientRoot() {
  // In dev we always resolve relative to the server source folder
  const clientRoot = path.resolve(__dirname, "..", "client");
  if (!fs.existsSync(clientRoot)) {
    throw new Error(
      `Client root directory not found: ${clientRoot}\n` +
        `Make sure the folder "client/" exists next to the server source.`,
    );
  }
  return clientRoot;
}


/* Logging utility  */

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}


/* Development: Vite middleware + SSR HTML injection  */


export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  const clientRoot = getClientRoot();
  const templatePath = path.resolve(clientRoot, "index.html");

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Vite template not found: ${templatePath}\n` +
        `Run "npm run build:client" or ensure client/index.html exists.`,
    );
  }

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Reload template on every request (dev only)
      let template = await fs.promises.readFile(templatePath, "utf-8");

      // Cache-bust the entry script
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);
      res
        .status(200)
        .set({ "Content-Type": "text/html" })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}


/* Production: serve static files from the built client   */

export function serveStatic(app: Express) {
  // On Vercel, static files are served by the edge network, not Express
  if (process.env.VERCEL) {
    console.log("🚀 Vercel detected: Skipping Express static file serving");
    return;
  }

  // In production the build output lives in <project>/dist/public
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}\n` +
        `Run "npm run build:client" to generate the client bundle.`,
    );
  }

  log(`Serving static files from ${distPath}`, "vite");
  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}