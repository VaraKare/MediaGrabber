import { type CharityStats as CharityStatsType, type InsertCharityStats as InsertCharityStatsType } from "@shared/schema";
import { DbStorage } from "./DbStorage";
import { InMemoryStorage } from "./InMemoryStorage";

export type CharityStats = CharityStatsType;
export type InsertCharityStats = InsertCharityStatsType;

export interface IStorage {
  getCharityStats(month: string, year: number): Promise<CharityStats | undefined>;
  updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats>;
  getCurrentCharityStats(): Promise<CharityStats | undefined>;
  incrementPremiumDownloads(): Promise<void>;
}

export const storage: IStorage = process.env.DATABASE_URL ? new DbStorage() : new InMemoryStorage();
