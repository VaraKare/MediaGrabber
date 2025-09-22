import { type CharityStats as CharityStatsType, type InsertCharityStats as InsertCharityStatsType } from "@shared/schema";
import { DbStorage } from "./DbStorage";

export type CharityStats = CharityStatsType;
export type InsertCharityStats = InsertCharityStatsType;

export interface IStorage {
  getCharityStats(month: string, year: number): Promise<CharityStats | undefined>;
  updateCharityStats(month: string, year: number, updates: Partial<InsertCharityStats>): Promise<CharityStats>;
  getCurrentCharityStats(): Promise<CharityStats | undefined>;
  incrementPremiumDownloads(): Promise<void>;
}

export const storage = new DbStorage();
