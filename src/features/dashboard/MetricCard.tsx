import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export function MetricCard({
  label,
  value,
  meta,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof Activity;
  accent: string;
  trend?: "up" | "down";
}) {
  return (
    <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)] transition-colors hover:bg-[#f4f7f3]">
      <CardContent className="flex min-w-0 flex-wrap items-center gap-4 p-5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${accent}`}
        >
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-[#4f514f]">
              {label}
            </p>
            {trend ? (
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${trend === "up" ? "bg-[#e7f5e9] text-[#197246]" : "bg-[#fff5e1] text-[#8a5a12]"}`}
              >
                {trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {trend === "up" ? "+" : ""}
                {meta}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[25px] font-bold tracking-[-0.04em] text-[#101413]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#5a6d63]">
            {trend
              ? trend === "up"
                ? "dari bulan lalu"
                : "dari minggu lalu"
              : meta}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
