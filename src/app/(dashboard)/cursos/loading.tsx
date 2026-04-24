import { SkeletonCourseCard } from '@/components/alumco/Skeletons'

export default function CursosTrabajadorLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-52 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2 animate-pulse">
        <div className="h-8 w-20 bg-slate-200 rounded-full" />
        <div className="h-8 w-28 bg-slate-100 rounded-full" />
        <div className="h-8 w-28 bg-slate-100 rounded-full" />
        <div className="h-8 w-24 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  )
}
