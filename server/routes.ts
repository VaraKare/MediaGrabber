import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { type InsertDownload as InsertDownloadType } from "@shared/schema";
import { z } from "zod";
import { getFormats } from "./yt-dlp";
import { getUrlPlatform } from "@shared/url-validator";
import youtubeDl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import type { ChildProcess } from "child_process";

// Infer the payload type directly from the function's return type
type YoutubeDlPayload = Awaited<ReturnType<typeof youtubeDl>>;
// Define a custom type that combines ChildProcess and the Promise returned by youtubeDl
type YoutubeDlProcess = ChildProcess & Promise<YoutubeDlPayload>;

interface InsertDownload extends InsertDownloadType {
  filePath?: string | null;
}

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// --- Mock Donor Count ---
let donorCount = 10; // Starting mock donor count

const log = (message: string) => console.log(`[SERVER] ${new Date().toLocaleTimeString()} - ${message}`);

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/donations", async (req, res) => {
    try {
      const stats = await storage.getCurrentCharityStats();
      // Include our mock donor count in the response
      res.json({ totalDonations: stats?.totalRaised || 0, donorCount });
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });
  
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Donations temporarily unavailable" });
    }
    try {
      const { amount, description } = z.object({ amount: z.number().positive(), description: z.string().optional() }).parse(req.body);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        description: description || "Donation to MediaHub",
        automatic_payment_methods: { enabled: true },
      });
      // Increment mock donor count on successful payment intent creation
      donorCount++;
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(error instanceof z.ZodError ? 400 : 500).json({ message: error.message });
    }
  });

  app.get("/api/charity/stats", async (req, res) => {
    try {
      const stats = await storage.getCurrentCharityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching charity stats:", error);
      res.status(500).json({ error: "Failed to fetch charity stats" });
    }
  });

app.get("/api/fetch-info", async (req, res) => {
    try {
      const url = z.string().url().parse(req.query.url);
      const platform = getUrlPlatform(url);

      if (platform === 'other') {
        return res.status(400).json({ error: "Coming soon for this platform" });
      }

      const ytDlpInfo = await getFormats(url);

      const mp4Resolutions = new Set<string>();
      const mp3Bitrates = new Set<string>();

      if (ytDlpInfo.formats) {
        ytDlpInfo.formats.forEach((format: any) => {
          if (format.ext === 'mp4' && format.height) {
            mp4Resolutions.add(`${format.height}p`);
          } else if (['m4a', 'mp3'].includes(format.ext) && format.acodec !== 'none' && format.abr) {
            mp3Bitrates.add(`${Math.round(format.abr)}kbps`);
          }
        });
      }

      const uniqueMp4Resolutions = Array.from(mp4Resolutions).sort((a, b) => parseInt(b) - parseInt(a));
      const uniqueMp3Bitrates = Array.from(mp3Bitrates).sort((a, b) => parseInt(b) - parseInt(a));

      res.json({
        title: ytDlpInfo.title,
        thumbnail: ytDlpInfo.thumbnail,
        platform,
        formats: [
          { format: 'mp4', resolutions: uniqueMp4Resolutions },
          { format: 'mp3', bitrates: uniqueMp3Bitrates },
        ]
      });
    } catch (error) {
      console.error("Error fetching formats:", error);
      res.status(400).json({ error: "Invalid url or failed to fetch formats" });
    }
  });

  // --- REVISED DOWNLOAD ENDPOINT FOR DIRECT STREAMING ---
  app.get("/api/download", async (req, res) => {
    log('Download request received.');
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    log(`Created temporary directory: ${tmpDir.name}`);

    try {
      const { url, format, quality, title } = z.object({
        url: z.string().url(),
        format: z.enum(['mp3', 'mp4']),
        quality: z.string(),
        title: z.string().optional(),
      }).parse(req.query);
      log(`Request validated: url=${url}, format=${format}, quality=${quality}`);
  
      const safeTitle = (title || 'download').replace(/[^a-z0-9-_.]/gi, '_');
      const finalFilename = `${safeTitle}.${format}`;
      log(`Video info fetched. Filename: ${finalFilename}`);

      const outputTemplate = path.join(tmpDir.name, `%(title)s.%(ext)s`);
  
      const options: any = {
        output: outputTemplate,
        progress: true,
      };

      if (format === 'mp4') {
        const requestedHeight = parseInt(quality);
        log(`MP4 download requested for height <= ${requestedHeight}p`);
        options.format = `bestvideo[height<=${requestedHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${requestedHeight}][ext=mp4]/best`;
        options['merge-output-format'] = 'mp4';

      } else { // mp3
        log(`MP3 download requested.`);
        options.extractAudio = true;
        options.audioFormat = 'mp3';
      }

      log(`Spawning yt-dlp with options: ${JSON.stringify(options)}`);
      
      const downloadProcess = youtubeDl.exec(url, options);

      let stderrOutput = '';
      if(downloadProcess.stderr) {
        downloadProcess.stderr.on('data', (data) => {
          stderrOutput += data.toString();
        });
      }
      
      await downloadProcess;
      log(`yt-dlp process finished.`);

      const filesInDir = fs.readdirSync(tmpDir.name);
      log(`Files in temp directory: [${filesInDir.join(', ')}]`);

      if (filesInDir.length === 0) {
        throw new Error(`No file was downloaded by yt-dlp. Stderr: ${stderrOutput}`);
      }

      const downloadedFile = filesInDir[0];
      const filePath = path.join(tmpDir.name, downloadedFile);
      
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty. yt-dlp may have failed silently.');
      }
      log(`Temporary file validation passed. Path: ${filePath}, Size: ${stats.size} bytes.`);
      
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');

      log('Response headers set. Creating read stream from temp file.');

      const readStream = fs.createReadStream(filePath);
      
      readStream.on('close', () => {
        log('Stream finished. Cleaning up temporary directory.');
        tmpDir.removeCallback();
      });

      readStream.on('error', (err) => {
        log(`ERROR - Could not stream temp file to response: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream file.' });
        }
        tmpDir.removeCallback();
      });

      readStream.pipe(res);
  
    } catch (error: any) {
      log(`FATAL ERROR in /api/download: ${error.message}`);
      if (!res.headersSent) {
          res.status(500).json({ error: error.message || "A critical error occurred while processing your download request." });
      }
      log('Cleaning up temporary directory due to error.');
      tmpDir.removeCallback();
    }
  });

  app.post("/api/record-ad-view", async (req, res) => {
    try {
        await storage.incrementPremiumDownloads();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error recording ad view:", error);
        res.status(500).json({ error: "Failed to record ad view" });
    }
  });

  return createServer(app);
}
