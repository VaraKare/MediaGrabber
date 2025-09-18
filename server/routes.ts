import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertDownloadSchema } from "@shared/schema";
import { z } from "zod";

// Initialize Stripe - using the blueprint integration
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Stripe payment route for donations - using blueprint integration
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        error: "Donations temporarily unavailable",
        message: "Payment processing is not configured. Please try again later." 
      });
    }

    try {
      // Validate request data
      const donationSchema = z.object({
        amount: z.number().positive().min(0.5).max(10000),
        description: z.string().max(200).optional()
      });
      
      const { amount, description } = donationSchema.parse(req.body);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description: description || "Charitable donation via MediaHub",
        automatic_payment_methods: { enabled: true },
        metadata: {
          source: 'mediahub_donation'
        }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid donation amount", 
          details: error.errors 
        });
      } else {
        console.error("Error creating payment intent:", error);
        res
          .status(500)
          .json({ message: "Error creating payment intent: " + error.message });
      }
    }
  });

  // Get charity stats
  app.get("/api/charity/stats", async (req, res) => {
    try {
      const stats = await storage.getCurrentCharityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching charity stats:", error);
      res.status(500).json({ error: "Failed to fetch charity stats" });
    }
  });

  // Create download
  app.post("/api/downloads", async (req, res) => {
    try {
      const validatedData = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(validatedData);
      
      // Start processing download asynchronously
      processDownload(download.id);
      
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

  // Get download status
  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      res.json(download);
    } catch (error) {
      console.error("Error fetching download:", error);
      res.status(500).json({ error: "Failed to fetch download" });
    }
  });

  // Get recent downloads
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

  // Serve download files
  app.get("/api/downloads/:id/file", async (req, res) => {
    try {
      const downloadId = req.params.id;
      const download = await storage.getDownload(downloadId);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      if (download.status !== "completed") {
        return res.status(400).json({ error: "Download not ready" });
      }
      
      // For demo purposes, serve a sample MP4 file
      // In a real implementation, this would serve the actual downloaded file
      const sampleContent = Buffer.from("Sample MP4 file content for demo");
      
      // Set proper headers for file download
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${download.title || 'download'}.mp4"`);
      res.setHeader('Content-Length', sampleContent.length.toString());
      res.setHeader('Cache-Control', 'private, no-cache');
      
      res.send(sampleContent);
    } catch (error) {
      console.error("Error serving download file:", error);
      res.status(500).json({ error: "Failed to serve download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simulate download processing
async function processDownload(downloadId: string) {
  try {
    // Update status to processing
    await storage.updateDownload(downloadId, { 
      status: "processing",
      progress: 10 
    });

    // Simulate processing time with progress updates
    const progressSteps = [25, 50, 75, 90, 100];
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (progress === 100) {
        // Simulate extracted metadata
        await storage.updateDownload(downloadId, {
          status: "completed",
          progress: 100,
          title: "Sample Media File",
          downloadUrl: `/api/downloads/${downloadId}/file`,
          fileSize: "15.2 MB",
          duration: "3:45",
          thumbnail: `https://picsum.photos/320/180?random=${downloadId}`,
          completedAt: new Date(),
        });

        // Update charity stats if premium download
        const download = await storage.getDownload(downloadId);
        if (download?.quality === "premium") {
          const now = new Date();
          const month = now.toLocaleString('default', { month: 'long' });
          const year = now.getFullYear();
          
          const currentStats = await storage.getCharityStats(month, year);
          if (currentStats) {
            await storage.updateCharityStats(month, year, {
              totalRaised: (currentStats.totalRaised || 0) + 2, // ₹2 per premium download
              premiumDownloads: (currentStats.premiumDownloads || 0) + 1,
            });
          }
        }
      } else {
        await storage.updateDownload(downloadId, { progress });
      }
    }
  } catch (error) {
    console.error("Error processing download:", error);
    await storage.updateDownload(downloadId, { 
      status: "failed",
      progress: 0 
    });
  }
}
