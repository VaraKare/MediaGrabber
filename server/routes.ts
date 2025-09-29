import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { type InsertDownload as InsertDownloadType } from "@shared/schema";
import { z } from "zod";
import { getVideoInfo, getDirectDownloadUrl } from "./downloader"; // UPDATED IMPORT
import { getUrlPlatform } from "@shared/url-validator";
import youtubeDl from 'youtube-dl-exec';

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
      // We pass undefined for requestedFormat/Quality as this is the info endpoint
      const videoInfo = await getVideoInfo(url); 

      if (!videoInfo || !videoInfo.thumbnail) {
          return res.status(404).json({ error: "Could not retrieve video information." });
      }
      
      // --- SERVER-SIDE THUMBNAIL FETCH AND BASE64 CONVERSION ---
      // This solves the CORS/CORP issue with Instagram/Facebook thumbnails.
      let thumbnailData = videoInfo.thumbnail;
      if (thumbnailData && !thumbnailData.startsWith('data:')) { // Only fetch if not already base64
        try {
          const imageResponse = await fetch(videoInfo.thumbnail);
          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            thumbnailData = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
            log("Successfully converted thumbnail to Base64.");
          }
        } catch (thumbError) {
          console.error("Failed to fetch and convert thumbnail, falling back to URL:", thumbError);
          thumbnailData = videoInfo.thumbnail; // Fallback to original URL
        }
      }
      
      res.json({
        ...videoInfo,
        thumbnail: thumbnailData, // Send the Base64 string or the original URL
      });

    } catch (error) {
      console.error("Error in /api/fetch-info:", error);
      res.status(400).json({ error: (error as Error).message || "Invalid URL or failed to fetch video information." });
    }
  });

  app.get("/api/download", async (req, res) => {
    log('Download stream request received.');
    
    try {
      const { url, format, quality, title } = z.object({
        url: z.string().url(),
        format: z.enum(['mp3', 'mp4']),
        quality: z.string(),
        title: z.string(),
      }).parse(req.query);
      log(`Request validated: url=${url}, format=${format}, quality=${quality}`);
  
      const platform = getUrlPlatform(url);
      const safeTitle = (title || 'download').replace(/[^a-z0-9-_.]/gi, '_');
      const finalFilename = `${safeTitle}.${format}`;
      
      // Attempt to get a direct download URL from RapidAPI
      const directDownloadUrl = await getDirectDownloadUrl(url, platform, format, quality);

      if (directDownloadUrl) {
          log(`Redirecting to direct download URL: ${directDownloadUrl}`);
          res.redirect(directDownloadUrl);
          return;
      }

      // If no direct URL from API or API failed, fallback to yt-dlp for streaming
      log("No direct download URL from API or API failed. Falling back to yt-dlp for streaming.");
      
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');

      const options: any = { output: '-' }; // Pipe to stdout

      if (format === 'mp4') {
        const requestedHeight = parseInt(quality);
        log(`MP4 stream requested for height <= ${requestedHeight}p`);
        options.format = `bestvideo[height<=${requestedHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${requestedHeight}][ext=mp4]/best`;
      } else { // mp3
        log(`MP3 stream requested.`);
        options.extractAudio = true;
        options.audioFormat = 'mp3';
      }

      log(`Spawning yt-dlp with options: ${JSON.stringify(options)}`);
      const downloadProcess = youtubeDl.exec(url, options);

      if (downloadProcess.stdout) {
        downloadProcess.stdout.pipe(res);
      } else {
          throw new Error("Could not create download stream from yt-dlp.");
      }
      
      if (downloadProcess.stderr) {
        downloadProcess.stderr.on('data', (data: Buffer) => {
          log(`[yt-dlp stderr]: ${data.toString()}`);
        });
      }

      req.on('close', () => {
        log('Client aborted the download. Killing yt-dlp process.');
        downloadProcess.kill();
      });
  
    } catch (error) {
      log(`ERROR in /api/download: ${error}`);
      if (!res.headersSent) {
          res.status(500).json({ error: (error as Error).message || "An error occurred while preparing your download." });
      }
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

