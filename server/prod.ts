// PRODUCTION-ONLY server entry point
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils"; // Import log from utils

const app = express();

// --- CRITICAL: Environment Variable Check ---
// This will run when the server starts and log the status of all required keys.
// Check your Render logs for this output!
log("--- Checking Environment Variables ---", "EnvCheck");
const requiredVars = [
    'RAPIDAPI_KEY', // Your single key for all RapidAPI services
    'TIKTOK_API_HOST',
    'PINTEREST_API_HOST',
    'SPOTIFY_API_HOST',
    'TERABOX_API_HOST',
    'GENERAL_API_HOST' // For the "all-video-downloader1"
];
let allKeysFound = true;
requiredVars.forEach(key => {
    if (process.env[key]) {
        log(`✅ ${key} is configured.`, "EnvCheck");
    } else {
        log(`❌ ${key} is MISSING.`, "EnvCheck", "ERROR"); // Log missing keys as errors
        allKeysFound = false;
    }
});
if (!allKeysFound) {
    log("🚨 FATAL: One or more required environment variables are missing. The server will not work correctly.", "EnvCheck", "ERROR");
} else {
    log("👍 All required API environment variables are present.", "EnvCheck");
}
log("------------------------------------", "EnvCheck");


// A specific list of allowed origins for production
const allowedOrigins = [
    'https://downloadmedia-umber.vercel.app',
    // Add other production origins if necessary
];

app.use(cors({ 
    origin: (origin, callback) => {
        // Allow requests from the allowed list.
        // `!origin` allows server-to-server or tools like Postman.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            log(`CORS: Disallowed origin in production: ${origin}`, "CORS");
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
log(`CORS enabled for: ${allowedOrigins.join(", ")}`, "CORS");


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1_000_000; // Convert to milliseconds
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration.toFixed(2)}ms`, "Request");
    }
  });
  next();
});


(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`ERROR: ${status} - ${message}`, "ErrorHandler", err); // Log full error object
    res.status(status).json({ message });
  });

  const isApiOnly = process.env.API_ONLY_MODE === 'true';

  if (isApiOnly) {
      log("Running in API-only mode. Frontend will not be served.", "Server");
      app.get("/", (_req, res) => {
          res.json({ message: "MediaHub API is running" });
      });
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`, "Server");
  });
})();
