import { IStorage, CharityStats, InsertCharityStats } from "./storage";
import { randomUUID } from "crypto";

export class InMemoryStorage implements IStorage {
  private charityStats: CharityStats[] = [];

  async getCharityStats(month: string, year: number): Promise<CharityStats | undefined> {
    return this.charityStats.find(s => s.month === month && s.year === year);
  }

  async updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats> {
    const existing = await this.getCharityStats(month, year);
    if (existing) {
      Object.assign(existing, updates);
      return existing;
    } else {
      const newStat: CharityStats = {
        id: randomUUID(),
        month,
        year,
        premiumDownloads: 0,
        totalRaised: 0,
        beneficiaries: 0,
        ...updates,
        updatedAt: new Date(),
      };
      this.charityStats.push(newStat);
      return newStat;
    }
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
    const existing = await this.getCharityStats(month, year);

    if (existing) {
      existing.premiumDownloads = (existing.premiumDownloads || 0) + 1;
      existing.totalRaised = (existing.totalRaised || 0) + 5;
      existing.updatedAt = new Date();
    } else {
      this.charityStats.push({
        id: randomUUID(),
        month,
        year,
        premiumDownloads: 1,
        totalRaised: 5,
        beneficiaries: 0,
        updatedAt: new Date(),
      });
    }
  }
}
