import { SkeletonCard } from '@/components/alumco/shared/Skeletons'

export default function NuevoEventoLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-52 bg-slate-200 rounded" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>
      <SkeletonCard />
    </div>
  )
}
