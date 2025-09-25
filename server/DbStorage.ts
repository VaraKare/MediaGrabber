import { db } from "./db";
import { charityStats } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IStorage, CharityStats as CharityStatsType, InsertCharityStats } from "./storage";
import { randomUUID } from "crypto";

export class DbStorage implements IStorage {
  constructor() {
    if (!db) {
      throw new Error("Database not initialized. Make sure DATABASE_URL is set.");
    }
  }

  async getCharityStats(month: string, year: number): Promise<CharityStatsType | undefined> {
    return await db!.query.charityStats.findFirst({
      where: and(eq(charityStats.month, month), eq(charityStats.year, year)),
    });
  }

  async updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStatsType> {
    const existing = await this.getCharityStats(month, year);
    if (existing) {
      const [updated] = await db!.update(charityStats).set(updates).where(eq(charityStats.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db!.insert(charityStats).values({ ...updates, month, year, id: randomUUID() }).returning();
      return created;
    }
  }

  async getCurrentCharityStats(): Promise<CharityStatsType | undefined> {
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
      await db!.update(charityStats).set({
        premiumDownloads: (existing.premiumDownloads || 0) + 1,
        totalRaised: (existing.totalRaised || 0) + 5,
        updatedAt: new Date(),
      }).where(eq(charityStats.id, existing.id));
    } else {
      await db!.insert(charityStats).values({
        id: randomUUID(),
        month,
        year,
        premiumDownloads: 1,
        totalRaised: 5,
        beneficiaries: 0, // You might want to initialize this differently
        updatedAt: new Date(),
      });
    }
  }
}
