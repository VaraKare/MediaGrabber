import { type Download, type InsertDownload, type CharityStats, type InsertCharityStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Downloads
  createDownload(download: InsertDownload): Promise<Download>;
  getDownload(id: string): Promise<Download | undefined>;
  updateDownload(id: string, updates: Partial<Download>): Promise<Download | undefined>;
  getRecentDownloads(limit?: number): Promise<Download[]>;
  
  // Charity Stats
  getCharityStats(month: string, year: number): Promise<CharityStats | undefined>;
  updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats>;
  getCurrentCharityStats(): Promise<CharityStats | undefined>;
}

export class MemStorage implements IStorage {
  private downloads: Map<string, Download>;
  private charityStats: Map<string, CharityStats>;

  constructor() {
    this.downloads = new Map();
    this.charityStats = new Map();
    
    // Initialize current month charity stats
    this.initializeCurrentStats();
  }

  private initializeCurrentStats() {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const key = `${month}-${year}`;
    
    if (!this.charityStats.has(key)) {
      const stats: CharityStats = {
        id: randomUUID(),
        month,
        year,
        totalRaised: 8247, // Current demo values
        highQualityDownloads: 12450,
        beneficiaries: 156,
        updatedAt: new Date(),
      };
      this.charityStats.set(key, stats);
    }
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const download: Download = {
      ...insertDownload,
      id,
      status: "pending",
      progress: 0,
      title: null,
      downloadUrl: null,
      fileSize: null,
      duration: null,
      thumbnail: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.downloads.set(id, download);
    return download;
  }

  async getDownload(id: string): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async updateDownload(id: string, updates: Partial<Download>): Promise<Download | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;
    
    const updated = { ...download, ...updates };
    this.downloads.set(id, updated);
    return updated;
  }

  async getRecentDownloads(limit = 10): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getCharityStats(month: string, year: number): Promise<CharityStats | undefined> {
    const key = `${month}-${year}`;
    return this.charityStats.get(key);
  }

  async updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats> {
    const key = `${month}-${year}`;
    const existing = this.charityStats.get(key);
    
    const stats: CharityStats = {
      id: existing?.id || randomUUID(),
      month,
      year,
      totalRaised: updates.totalRaised ?? existing?.totalRaised ?? 0,
      highQualityDownloads: updates.highQualityDownloads ?? existing?.highQualityDownloads ?? 0,
      beneficiaries: updates.beneficiaries ?? existing?.beneficiaries ?? 0,
      updatedAt: new Date(),
    };
    
    this.charityStats.set(key, stats);
    return stats;
  }

  async getCurrentCharityStats(): Promise<CharityStats | undefined> {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    return this.getCharityStats(month, year);
  }
}

export const storage = new MemStorage();
