import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
};
export type Counts = {
  population: number;
  cages: number;
  reports: number;
  production: number;
  feed: number;
  deaths: number;
  completion: number;
};
export type DailyRow = {
  id: string;
  cage_id: string;
  condition: string;
  feed_used: number | null;
  mortality: number;
  production_quantity: number | null;
  report_date: string;
  status?: string | null;
  created_at?: string;
};
export type DailyCage = {
  id?: string;
  code: string;
  name: string;
  population: number;
  type: string;
  reported: boolean;
  time: string;
};
export type CageRecord = DailyCage & {
  id: string;
  livestockTypeId?: string | null;
  location?: string | null;
  capacity?: number | null;
  notes?: string | null;
  male: number;
  female: number;
  status: "Aktif" | "Nonaktif" | "Pemeliharaan";
  last: string;
  date: string;
};
export type AppRole = "admin" | "petugas";
export type AuditActivity = {
  id: string;
  actor_name: string | null;
  action: string;
  entity: string;
  summary: string | null;
  created_at: string;
};
export type FeedAlert = {
  feedTypeId: string;
  name: string;
  stock: number;
  threshold: number;
};
export type FeedStock = {
  feedTypeId: string;
  name: string;
  stock: number;
  threshold: number | null;
};
