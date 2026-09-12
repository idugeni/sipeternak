import { Skeleton } from "@/components/ui/skeleton";

// Skeleton mengikuti layout asli tiap view agar tidak ada lompatan layout (CLS) saat data tiba.
function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`bg-[#e4ebe4] ${className}`} />;
}

export function MetricGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border border-[#e2e2df] bg-white p-5"
        >
          <Block className="h-14 w-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Block className="h-3 w-24" />
            <Block className="h-7 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Block className="h-7 w-40" />
          <Block className="h-4 w-72" />
        </div>
        <Block className="hidden h-4 w-44 sm:block" />
      </div>
      <MetricGridSkeleton />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block className="h-[76px] rounded-lg" />
        <Block className="h-[76px] rounded-lg" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Block className="h-[300px] rounded-xl" />
        <Block className="h-[300px] rounded-xl" />
      </div>
      <Block className="mt-4 h-[280px] rounded-xl" />
    </>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border border-[#edf1ed] bg-white p-4"
        >
          <Block className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Block className="h-4 w-1/3" />
            <Block className="h-3 w-1/2" />
          </div>
          <Block className="hidden h-8 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-[#e2e2df] bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <Block className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block className="h-4 w-2/3" />
              <Block className="h-3 w-1/3" />
            </div>
          </div>
          <Block className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
