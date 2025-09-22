import { type CharityStats as CharityStatsType, type InsertCharityStats } from "@shared/schema";
import { randomUUID } from "crypto";

interface CharityStats extends CharityStatsType {
  highQualityDownloads?: number | null;
}

export interface IStorage {
  getCharityStats(month: string, year: number): Promise<CharityStats | undefined>;
  updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats>;
  getCurrentCharityStats(): Promise<CharityStats | undefined>;
  incrementPremiumDownloads(): Promise<void>;
}

export class MemStorage implements IStorage {
  private charityStats: Map<string, CharityStats>;

  constructor() {
    this.charityStats = new Map();
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
        premiumDownloads: 12450,
        highQualityDownloads: 8000,
        beneficiaries: 156,
        updatedAt: new Date(),
      };
      this.charityStats.set(key, stats);
    }
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
      premiumDownloads: (updates as any).premiumDownloads ?? (existing as any)?.premiumDownloads ?? 0,
      highQualityDownloads: (updates as any).highQualityDownloads ?? (existing as any)?.highQualityDownloads ?? 0,
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

  async incrementPremiumDownloads(): Promise<void> {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const key = `${month}-${year}`;
    const existing = this.charityStats.get(key);

    if (existing) {
        existing.premiumDownloads = (existing.premiumDownloads || 0) + 1;
        // Assuming 5 cents ($0.05) per premium ad view
        existing.totalRaised = (existing.totalRaised || 0) + 5;
        existing.updatedAt = new Date();
        this.charityStats.set(key, existing);
    } else {
        this.initializeCurrentStats();
        const newStats = this.charityStats.get(key)!;
        newStats.premiumDownloads = 1;
        newStats.totalRaised = 5;
        this.charityStats.set(key, newStats);
    }
  }
}

export const storage = new MemStorage();