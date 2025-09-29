// PRODUCTION-ONLY server entry point
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";
import { API_CONFIG } from "./downloader"; // Import the config to check env vars

const app = express();

// --- CRITICAL: Environment Variable Check ---
// This will run when the server starts and log the status of all required keys.
// Check your Render logs for this output!
console.log("--- Checking Environment Variables ---");
const requiredVars = [
    'RAPIDAPI_KEY',
    'YOUTUBE_API_HOST',
    'TIKTOK_API_HOST',
    'PINTEREST_API_HOST',
    'SPOTIFY_API_HOST',
    'TERABOX_API_HOST',
    'GENERAL_API_HOST'
];
let allKeysFound = true;
requiredVars.forEach(key => {
    if (process.env[key]) {
        console.log(`✅ ${key} is configured.`);
    } else {
        console.error(`❌ ${key} is MISSING.`);
        allKeysFound = false;
    }
});
if (!allKeysFound) {
    console.error("🚨 FATAL: One or more required environment variables are missing. Server will likely fail.");
} else {
    console.log("👍 All required API environment variables are present.");
}
console.log("------------------------------------");


// A specific list of allowed origins for production
const allowedOrigins = [
    'https://downloadmedia-umber.vercel.app',
];

app.use(cors({ 
    origin: (origin, callback) => {
        // Allow requests from the allowed list.
        // `!origin` allows server-to-server or tools like Postman.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            log(`CORS: Disallowed origin in production: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
log(`CORS enabled for: ${allowedOrigins.join(", ")}`);


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

  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();

