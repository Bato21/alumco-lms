import { SkeletonHero, SkeletonStatsRow } from '@/components/alumco/Skeletons'

export default function InicioLoading() {
  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-36 bg-slate-100 rounded" />
      </div>
      <SkeletonHero />
      <SkeletonStatsRow />
      {/* Calendario placeholder */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-100 rounded mb-6" />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
