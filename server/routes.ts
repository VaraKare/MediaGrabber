import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from 'child_process';
import Stripe from "stripe";
import { storage } from "./storage";
import { insertDownloadSchema, type InsertDownload as InsertDownloadType } from "@shared/schema";
import { z } from "zod";
import { getFormats } from "./yt-dlp";
import fs from "fs";
import path from "path";
import { getUrlPlatform } from "@shared/url-validator";
import ffmpeg from 'fluent-ffmpeg';

interface InsertDownload extends InsertDownloadType {
  filePath?: string | null;
}

// Helper to spawn a yt-dlp process for streaming
const getDownloadStream = (url: string, args: string[]) => {
  const allArgs = [
      url,
      ...args,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  ];
  const ytDlpProcess = spawn('yt-dlp', allArgs);
  return ytDlpProcess;
};


// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

const mockDonations = [
  { name: "Alice Johnson", amount: 50 },
  { name: "Bob Williams", amount: 25 },
  { name: "Charlie Brown", amount: 10 },
];

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/donations", async (req, res) => {
    try {
      const totalDonations = mockDonations.reduce((sum, d) => sum + d.amount, 0);
      res.json({ totalDonations, donors: mockDonations });
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
          } else if (format.ext === 'm4a' && format.acodec !== 'none' && format.abr) {
            mp3Bitrates.add(`${Math.round(format.abr)}kbps`);
          }
        });
      }

      const uniqueMp4Resolutions = Array.from(mp4Resolutions).sort((a, b) => parseInt(a) - parseInt(b));
      const uniqueMp3Bitrates = Array.from(mp3Bitrates).sort((a, b) => parseInt(a) - parseInt(b));

      res.json({
        title: ytDlpInfo.title,
        thumbnail: ytDlpInfo.thumbnail,
        platform,
        formats: [
          { format: 'mp4', resolutions: uniqueMp4Resolutions },
          { format: 'mp3', bitrates: uniqueMp3Bitrates },
        ]
      });
    } catch (error: any) {
        console.error("Error fetching formats:", error);
        res.status(400).json({ error: error.message || "Invalid url or failed to fetch formats" });
    }
  });

  app.post("/api/download", async (req, res) => {
    try {
      const { url, format, quality } = z.object({
        url: z.string().url(),
        format: z.enum(['mp3', 'mp4']),
        quality: z.string(),
      }).parse(req.body);

      const videoInfo = await getFormats(url);

      res.header('Content-Disposition', `attachment; filename="${videoInfo.title || 'download'}.${format}"`);

      if (format === 'mp4') {
        const videoFormat = videoInfo.formats.find((f: any) => f.format_note === quality && f.ext === 'mp4');
        const audioFormat = videoInfo.formats.find((f: any) => f.acodec !== 'none' && f.ext === 'm4a');

        // If we have separate video and audio, merge them with ffmpeg
        if (videoFormat && videoFormat.vcodec !== 'none' && audioFormat) {
          console.log(`Merging formats: video ${videoFormat.format_id}, audio ${audioFormat.format_id}`);
          const videoStream = getDownloadStream(url, ['-f', videoFormat.format_id, '-o', '-']);
          const audioStream = getDownloadStream(url, ['-f', audioFormat.format_id, '-o', '-']);

          ffmpeg()
            .input(videoStream.stdout)
            .input(audioStream.stdout)
            .outputOptions('-c:v', 'copy')
            .toFormat('mp4')
            .on('error', (err) => {
              console.error('ffmpeg error:', err);
              // Can't send headers after they are sent, but can try to end the response.
              if (!res.headersSent) {
                res.status(500).json({ error: 'Error during video processing.' });
              }
            })
            .pipe(res, { end: true });

        } else { // Otherwise, find the best format with both video and audio and stream it directly
          const bestFormat = videoInfo.formats.find((f: any) => f.format_note === quality && f.ext === 'mp4' && f.acodec !== 'none');
          if (bestFormat) {
            console.log(`Direct downloading format: ${bestFormat.format_id}`);
            const downloadProcess = getDownloadStream(url, ['-f', bestFormat.format_id, '-o', '-']);
            downloadProcess.stdout.pipe(res);
            downloadProcess.stderr.on('data', (data) => {
                console.error(`yt-dlp stderr: ${data}`);
            });
          } else {
            res.status(404).json({ error: "Requested quality not found or available for direct download." });
          }
        }
      } else if (format === 'mp3') {
        console.log(`Extracting audio for ${url}`);
        const downloadProcess = getDownloadStream(url, ['-x', '--audio-format', 'mp3', '-o', '-']);
        downloadProcess.stdout.pipe(res);
        downloadProcess.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });
      }

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid download data", details: error.errors });
      } else {
        console.error("Error creating download:", error);
        res.status(500).json({ error: error.message || "Failed to create download" });
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
