import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            /^https:\/\/downloadmedia-.*\.vercel\.app$/,
            'https://mediagrabber-elbv.onrender.com',
            'http://localhost:5001',
            'http://localhost:5173'
        ];
        if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
            log(`CORS: Allowed origin: ${origin}`);
            callback(null, true);
        } else {
            log(`CORS: Disallowed origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
log(`CORS enabled for specific origins.`);

app.use((_req, res, next) => {
    res.on('finish', () => {
        log(`Response headers: ${JSON.stringify(res.getHeaders())}`);
    });
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const isApiOnly = process.env.API_ONLY_MODE === 'true';

  if (isApiOnly) {
      log("Running in API-only mode. Frontend will not be served.");
      app.get("/", (_req, res) => {
          res.json({ message: "MediaHub API is running" });
      });
  } else {
    if (app.get("env") === "development") {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  }

  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
