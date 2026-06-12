import { SkeletonCard } from '@/components/alumco/Skeletons'

export default function CursoDetalleLoading() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-slate-200 rounded" />

      {/* Hero del curso */}
      <div className="h-48 bg-slate-200 rounded-2xl" />

      {/* Barra de progreso */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded" />
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full" />
        <div className="h-3 w-44 bg-slate-100 rounded" />
      </div>

      {/* Lista de módulos */}
      <div className="space-y-4">
        <div className="h-5 w-44 bg-slate-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <SkeletonCard className="flex-1 h-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
