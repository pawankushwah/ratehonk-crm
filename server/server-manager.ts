import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerSimpleRoutes } from "./simple-routes";
import { setupVite, serveStatic, log } from "./vite";

class ServerManager {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Configure CORS
    this.app.use(cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }
          log(logLine);
        }
      });

      next();
    });
  }

  async start() {
    try {
      // Register API routes
      this.server = await registerSimpleRoutes(this.app);

      // Error handling middleware
      this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error('Server error:', err);
        res.status(status).json({ message });
      });

      // Setup Vite in development
      if (this.app.get("env") === "development") {
        await setupVite(this.app, this.server);
      } else {
        serveStatic(this.app);
      }

      // Start server
      const port = process.env.PORT || 5000;
      return new Promise((resolve, reject) => {
        const serverInstance = this.server.listen(port, "0.0.0.0", () => {
          log(`Travel CRM server running on port ${port}`);
          resolve(serverInstance);
        });

        serverInstance.on('error', (error: any) => {
          console.error('Server startup error:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

export { ServerManager };