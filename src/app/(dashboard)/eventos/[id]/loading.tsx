import { SkeletonCard } from '@/components/alumco/shared/Skeletons'

export default function EventoDetalleLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      <div className="animate-pulse h-4 w-full max-w-xl bg-slate-100 rounded" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
