import { SkeletonStatsRow, SkeletonTable } from '@/components/alumco/Skeletons'

export default function ReportesLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>
      <SkeletonStatsRow />
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
      <SkeletonTable rows={8} />
    </div>
  )
}
