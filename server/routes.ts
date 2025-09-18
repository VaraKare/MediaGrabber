import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertDownloadSchema, type InsertDownload } from "@shared/schema";
import { z } from "zod";

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

  app.post("/api/downloads", async (req, res) => {
    try {
      const validatedData = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(validatedData);
      processDownload(download.id, validatedData.quality);
      res.json(download);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid download data", details: error.errors });
      } else {
        console.error("Error creating download:", error);
        res.status(500).json({ error: "Failed to create download" });
      }
    }
  });

  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) return res.status(404).json({ error: "Download not found" });
      res.json(download);
    } catch (error) {
      console.error("Error fetching download:", error);
      res.status(500).json({ error: "Failed to fetch download" });
    }
  });

  app.get("/api/downloads", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const downloads = await storage.getRecentDownloads(limit);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  app.get("/api/downloads/:id/file", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download || download.status !== "completed") return res.status(404).send();
      const sampleContent = Buffer.from("Sample MP4 file content");
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${download.title || 'download'}.mp4"`);
      res.send(sampleContent);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).send();
    }
  });

  return createServer(app);
}

async function processDownload(downloadId: string, quality: InsertDownload['quality']) {
  try {
    const adWaitTime = quality === 'premium' ? 30000 : 15000;
    await new Promise(resolve => setTimeout(resolve, adWaitTime));

    await storage.updateDownload(downloadId, { status: "processing", progress: 10 });

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

    await storage.updateDownload(downloadId, {
      status: "completed",
      progress: 100,
      title: "Sample Media File",
      downloadUrl: `/api/downloads/${downloadId}/file`,
      completedAt: new Date(),
    });

    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const currentStats = await storage.getCharityStats(month, year);
    if (currentStats) {
      await storage.updateCharityStats(month, year, {
        totalRaised: (currentStats.totalRaised || 0) + (quality === 'premium' ? 2 : 1),
        downloads: (currentStats.downloads || 0) + 1,
      });
    }

  } catch (error) {
    console.error(`Error processing download ${downloadId}:`, error);
    await storage.updateDownload(downloadId, { status: "failed", progress: 0 });
  }
}
