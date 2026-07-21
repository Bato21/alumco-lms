import { SkeletonCard } from '@/components/alumco/shared/Skeletons'

export default function AdminEventoDetalleLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
