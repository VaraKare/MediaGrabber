// PRODUCTION-ONLY server entry point
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";

const app = express();

// CORS Middleware
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(origin => origin.trim());
if (allowedOrigins && allowedOrigins.length > 0) {
    app.use(cors({ 
        origin: allowedOrigins,
        credentials: true
    }));
    log(`CORS enabled for: ${allowedOrigins.join(", ")}`);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Note: The request logging middleware from index.ts is omitted for brevity in production,
// but could be included if desired.

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // In production, you might not want to throw the error further
  });

  const isApiOnly = process.env.API_ONLY_MODE === 'true';

  if (isApiOnly) {
      log("Running in API-only mode. Frontend will not be served.");
      app.get("/", (_req, res) => {
          res.json({ message: "MediaHub API is running" });
      });
  } else {
    // In production, we always serve the static files.
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
