import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Centralized logging utility.
 * @param message The message to log.
 * @param source The source of the log (e.g., 'express', 'downloader').
 * @param data Optional data object to pretty-print (e.g., API responses).
 */
export function log(message: string, source = "express", data?: any) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
  if (data) {
    console.log(`[${source}] Data:`, data);
  }
}

export function serveStatic(app: Express) {
  // CORRECTED: Point to the correct build output directory at the project root
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  log(`Serving static files from: ${distPath}`, 'StaticServer');

  if (!fs.existsSync(distPath)) {
    log(`Error: Build directory not found at: ${distPath}`, 'StaticServer');
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    log(`Serving index.html from: ${indexPath}`, 'StaticServer');
    res.sendFile(indexPath);
  });
}
