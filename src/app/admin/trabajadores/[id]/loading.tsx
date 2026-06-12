import { SkeletonCard, SkeletonStatsRow, SkeletonTable } from '@/components/alumco/Skeletons'

export default function TrabajadorDetalleLoading() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-6 w-56 bg-slate-200 rounded" />
      </div>

      {/* Card de perfil */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-28 bg-slate-100 rounded" />
        </div>
      </div>

      <SkeletonStatsRow />
      <SkeletonTable rows={5} />
    </div>
  )
}
