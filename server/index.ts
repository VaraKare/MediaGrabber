import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";
import { setupVite } from "./vite";

const app = express();

// A specific list of allowed origins for development
const allowedOrigins = [
    // Regex to match Vercel deployment URLs (including preview branches)
    /^https:\/\/downloadmedia-.*\.vercel\.app$/,
    // Your specific production URL
    'https://downloadmedia-umber.vercel.app',
    // Your Render backend URL
    'https://mediagrabber-elbv.onrender.com',
    // Local development URLs
    'http://localhost:5001',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or from our list of allowed origins.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            log(`CORS: Disallowed origin in dev: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
log(`CORS configured for development.`);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
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
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5001', 10);
  const listener = server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });

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
