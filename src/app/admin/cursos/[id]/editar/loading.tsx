import { SkeletonCard } from '@/components/alumco/Skeletons'

export default function EditarCursoLoading() {
  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-44 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-28" />
      <SkeletonCard className="h-28" />
      <SkeletonCard className="h-28" />
    </div>
  )
}
