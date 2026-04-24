import { SkeletonProfileCard, SkeletonStatsRow } from '@/components/alumco/Skeletons'

export default function PerfilLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-8">
      <div className="animate-pulse space-y-1">
        <div className="h-6 w-28 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      <SkeletonProfileCard />
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-24 bg-slate-100 rounded-full" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 animate-pulse space-y-4">
        <div className="h-4 w-48 bg-slate-100 rounded" />
        <div className="h-10 w-full bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>
      <SkeletonStatsRow />
    </div>
  )
}
