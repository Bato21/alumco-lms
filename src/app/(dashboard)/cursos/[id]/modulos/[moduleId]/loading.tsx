import { SkeletonCard } from '@/components/alumco/Skeletons'

export default function ModuloLoading() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-5">
          {/* Breadcrumb */}
          <div className="h-4 w-56 bg-slate-200 rounded" />

          {/* Header del módulo */}
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-6 w-2/3 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
          </div>

          {/* Player */}
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 md:p-6">
            <div className="aspect-video w-full bg-slate-200 rounded-xl" />
          </div>

          {/* Navegación */}
          <div className="flex justify-between gap-3">
            <div className="h-12 w-40 bg-slate-100 rounded-xl" />
            <div className="h-12 w-40 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:flex flex-col gap-5">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-36" />
        </div>
      </div>
    </div>
  )
}
