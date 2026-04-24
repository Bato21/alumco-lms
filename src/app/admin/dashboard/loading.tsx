import { SkeletonHero, SkeletonStatsRow, SkeletonTable } from '@/components/alumco/Skeletons'

export default function DashboardLoading() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <SkeletonHero />
      <div className="p-4 lg:p-8 space-y-8">
        {/* Tabs placeholder */}
        <div className="flex gap-2 animate-pulse">
          <div className="h-8 w-32 bg-slate-200 rounded-full" />
          <div className="h-8 w-28 bg-slate-100 rounded-full" />
          <div className="h-8 w-28 bg-slate-100 rounded-full" />
        </div>
        <SkeletonStatsRow />
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 animate-pulse space-y-4 h-48">
            <div className="h-4 w-40 bg-slate-100 rounded" />
            <div className="space-y-3">
              <div className="h-3 w-full bg-slate-100 rounded-full" />
              <div className="h-3 w-full bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 animate-pulse h-48">
            <div className="h-4 w-32 bg-slate-100 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl h-40 animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />
            <div className="bg-[#1A2F6B] rounded-2xl h-32 animate-pulse" />
          </div>
        </div>
        <SkeletonTable rows={8} />
      </div>
    </div>
  )
}
