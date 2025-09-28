// PRODUCTION-ONLY server entry point
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";

const app = express();

// CORS Middleware
const allowedOrigins = [
    'https://downloadmedia-umber.vercel.app', // Your main Vercel project URL
    /^https:\/\/downloadmedia-.*\.vercel\.app$/, // Regex to match all Vercel preview deployments
    'http://localhost:5001',
];
const corsOriginsFromEnv = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim());

app.use(cors({ 
    origin: (origin, callback) => {
        const origins = corsOriginsFromEnv || allowedOrigins;
        if (!origin || origins.some(o => (typeof o === 'string' ? o === origin : o.test(origin)))) {
            callback(null, true);
        } else {
            log(`CORS: Disallowed origin in production: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
log(`CORS configured.`);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const isApiOnly = process.env.API_ONLY_MODE === 'true';

  if (isApiOnly) {
      log("Running in API-only mode. Frontend will not be served.");
      app.get("/", (_req, res) => {
          res.json({ message: "MediaHub API is running" });
      });
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  const listener = server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      log(`Received ${signal}, shutting down gracefully.`);
      listener.close(() => {
        log('Server closed.');
        process.exit(0);
      });
    });
  });

})();

