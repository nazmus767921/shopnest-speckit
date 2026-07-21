import { Skeleton } from "@/components/ui/skeleton"

export default function CustomerDetailsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/10 min-h-screen text-slate-900">
      
      {/* Back button Navigation Skeleton */}
      <div>
        <Skeleton className="h-5 w-36 rounded-lg" />
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ROW 1 */}
        
        {/* Profile Card (2/3 width) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48 rounded-lg mt-0.5" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Spend Metric Card (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-36 rounded-lg mt-3" />
          </div>
          <Skeleton className="h-3.5 w-48 rounded mt-4" />
        </div>

        {/* ROW 2 */}
        
        {/* Total Orders Card (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-12 rounded-lg mt-3" />
          </div>
          <Skeleton className="h-3.5 w-40 rounded mt-4" />
        </div>

        {/* Saved Addresses Card (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <Skeleton className="h-3 w-32 rounded" />
            <div className="flex flex-col gap-1.5 mt-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>

        {/* Telemetry Card (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <Skeleton className="h-3 w-28 rounded mb-3" />
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>

        {/* ROW 3 */}
        
        {/* Recent Orders List Card (2/3 width) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <Skeleton className="h-4.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-40 rounded mt-1.5" />
              </div>
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            
            <div className="h-[260px] flex flex-col justify-between">
              {/* Header row mock */}
              <div className="pb-3 flex justify-between items-center">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              {/* Table Rows mock */}
              <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-around">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Moderation Card (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <Skeleton className="h-4.5 w-36 rounded border-b border-slate-100 pb-3 mb-4" />
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* ROW 4 */}
        
        {/* Internal Notes Card (2/3 width) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div>
            <Skeleton className="h-4.5 w-36 rounded border-b border-slate-100 pb-3 mb-4" />
            
            {/* Note form mock */}
            <div className="flex flex-col gap-3 mb-5 p-4 border border-slate-150 rounded-xl bg-slate-50/30">
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>

            {/* Note timeline list mock */}
            <div className="h-[220px] flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/10">
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-2/3 rounded mt-1" />
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone (1/3 width, Red Background Fill) */}
        <div className="md:col-span-1 bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-start gap-2.5 border-b border-red-150 pb-3 mb-4">
              <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-full mt-6 rounded-xl" />
        </div>

      </div>

    </div>
  )
}
