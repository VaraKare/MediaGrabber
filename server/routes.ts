import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { type InsertDownload as InsertDownloadType } from "@shared/schema";
import { z } from "zod";
import { getVideoInfo, getDirectDownloadUrl } from "./downloader";
import { getUrlPlatform, isPlaylistOrAlbum } from "@shared/url-validator";
import youtubeDl from 'youtube-dl-exec';
import { log } from "./utils";

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// --- Mock Donor Count ---
let donorCount = 10; // Starting mock donor count

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/donations", async (req, res) => {
    try {
      const stats = await storage.getCurrentCharityStats();
      res.json({ totalDonations: stats?.totalRaised || 0, donorCount });
    } catch (error) {
      log(`Error fetching donations: ${(error as Error).message}`, 'API');
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
      log(`Error fetching charity stats: ${(error as Error).message}`, 'API');
      res.status(500).json({ error: "Failed to fetch charity stats" });
    }
  });

  app.get("/api/fetch-info", async (req, res) => {
    const url = z.string().url().safeParse(req.query.url);

    if (!url.success) {
      return res.status(400).json({ error: "Invalid URL provided." });
    }

    log(`Received /api/fetch-info request for URL: ${url.data}`, 'FetchInfo');

    try {
        // --- Playlist & Album Download Check ---
        const playlistCheck = isPlaylistOrAlbum(url.data);
        if (playlistCheck.isPlaylist) {
            const message = `${playlistCheck.platform} playlist/album downloads are not supported yet. Please use a link to a single item.`;
            log(`Playlist/Album detected for ${playlistCheck.platform}. Rejecting request.`, 'FetchInfo');
            return res.status(400).json({ error: message });
        }

        const videoInfo = await getVideoInfo(url.data); 

        if (!videoInfo || !videoInfo.thumbnail) {
            return res.status(404).json({ error: "Could not retrieve video information." });
        }
      
        let thumbnailData = videoInfo.thumbnail;
        if (thumbnailData && !thumbnailData.startsWith('data:')) {
            try {
                const imageResponse = await fetch(videoInfo.thumbnail);
                if (imageResponse.ok) {
                    const buffer = await imageResponse.arrayBuffer();
                    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                    thumbnailData = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
                    log("Successfully converted thumbnail to Base64.", 'FetchInfo');
                }
            } catch (thumbError) {
                log(`Failed to fetch and convert thumbnail, falling back to URL: ${(thumbError as Error).message}`, 'FetchInfo');
            }
        }
      
        log(`Successfully returned video info for ${url.data}.`, 'FetchInfo');
        res.json({
            ...videoInfo,
            thumbnail: thumbnailData,
        });

    } catch (error) {
        log(`Error in /api/fetch-info for URL: ${url.data}. Error: ${(error as Error).message}`, 'FetchInfo', error);
        res.status(400).json({ error: (error as Error).message || "Invalid URL or failed to fetch video information." });
    }
  });

  app.get("/api/download", async (req, res) => {
    log('Download stream request received.', 'Download');
    
    try {
      const { url, format, quality, title } = z.object({
        url: z.string().url(),
        format: z.enum(['mp3', 'mp4']),
        quality: z.string(),
        title: z.string(),
      }).parse(req.query);
      log(`Request validated: url=${url}, format=${format}, quality=${quality}`, 'Download');
  
      const platform = getUrlPlatform(url);
      const safeTitle = (title || 'download').replace(/[^a-z0-9-_.]/gi, '_');
      const finalFilename = `${safeTitle}.${format}`;
      
      const directDownloadUrl = await getDirectDownloadUrl(url, platform, format, quality);

      if (directDownloadUrl) {
          log(`Redirecting to direct download URL: ${directDownloadUrl}`, 'Download');
          res.redirect(directDownloadUrl);
          return;
      }

      log("No direct download URL from API or API failed. Falling back to yt-dlp for streaming.", 'Download');
      
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');

      const options: any = { output: '-' }; // Pipe to stdout

      if (format === 'mp4') {
        const requestedHeight = parseInt(quality);
        log(`MP4 stream requested for height <= ${requestedHeight}p`, 'Download');
        options.format = `bestvideo[height<=${requestedHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${requestedHeight}][ext=mp4]/best`;
      } else { // mp3
        log(`MP3 stream requested.`, 'Download');
        options.extractAudio = true;
        options.audioFormat = 'mp3';
      }

      log(`Spawning yt-dlp with options: ${JSON.stringify(options)}`, 'Download');
      const downloadProcess = youtubeDl.exec(url, options);

      if (downloadProcess.stdout) {
        downloadProcess.stdout.pipe(res);
      } else {
          throw new Error("Could not create download stream from yt-dlp.");
      }
      
      if (downloadProcess.stderr) {
        downloadProcess.stderr.on('data', (data: Buffer) => {
          log(`[yt-dlp stderr]: ${data.toString()}`, 'Download');
        });
      }

      req.on('close', () => {
        log('Client aborted the download. Killing yt-dlp process.', 'Download');
        downloadProcess.kill();
      });
  
    } catch (error) {
      log(`ERROR in /api/download: ${error}`, 'Download');
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
        log(`Error recording ad view: ${(error as Error).message}`, 'API');
        res.status(500).json({ error: "Failed to record ad view" });
    }
  });

  return createServer(app);
}

