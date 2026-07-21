import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6 text-foreground pb-24 relative font-sans">
      
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg mt-2" />
        </div>
      </div>

      {/* Search Controls & Count Badge Row Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 w-full max-w-md">
          <div className="relative w-full">
            <Skeleton className="absolute left-3 top-3 h-4 w-4 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Table Skeleton (DataTable wrapper) */}
      <div className="w-full">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Table Header */}
          <div className="bg-muted/40 border-b border-border p-4 flex justify-between items-center">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex justify-end w-24">
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-lg" />
                <div className="flex justify-end w-24">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
