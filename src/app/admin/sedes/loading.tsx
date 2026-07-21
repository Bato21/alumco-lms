import { SkeletonCard } from '@/components/alumco/shared/Skeletons'

export default function SedesLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-56 bg-slate-100 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
