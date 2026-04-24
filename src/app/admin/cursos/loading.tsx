import { SkeletonCourseCard } from '@/components/alumco/Skeletons'

export default function CursosAdminLoading() {
  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">
      <div className="flex justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-44 bg-slate-200 rounded-xl" />
      </div>
      <div className="flex gap-2 animate-pulse">
        <div className="h-8 w-20 bg-slate-200 rounded-full" />
        <div className="h-8 w-28 bg-slate-100 rounded-full" />
        <div className="h-8 w-28 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  )
}
