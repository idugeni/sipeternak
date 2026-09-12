import {
  ClipboardList,
  Egg,
  FileBarChart2,
  HeartPulse,
  LayoutDashboard,
  PawPrint,
  Settings2,
  ShieldCheck,
  Warehouse,
  Wheat,
} from "lucide-react";
import type { NavItem } from "@/features/shared/types";
export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Laporan Harian", icon: ClipboardList },
      { label: "Livestock & Populasi", icon: PawPrint },
    ],
  },
  {
    label: "Operasional",
    items: [
      { label: "Kandang & Kelompok", icon: Warehouse },
      { label: "Pakan", icon: Wheat },
      { label: "Produksi", icon: Egg },
      { label: "Kesehatan", icon: HeartPulse },
    ],
  },
  {
    label: "Insight",
    items: [
      { label: "Laporan & Riwayat", icon: FileBarChart2 },
      { label: "Audit Log", icon: ShieldCheck, adminOnly: true },
      { label: "Master Data", icon: Settings2, adminOnly: true },
    ],
  },
];
