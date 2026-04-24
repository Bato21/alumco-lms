import { SkeletonTable } from '@/components/alumco/Skeletons'

export default function TrabajadoresLoading() {
  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">
      <div className="flex justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-slate-200 rounded" />
          <div className="h-4 w-80 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-40 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-2 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-full" />
        <div className="h-8 w-32 bg-slate-100 rounded-full" />
        <div className="h-8 w-36 bg-slate-100 rounded-full" />
      </div>
      <SkeletonTable rows={8} />
    </div>
  )
}
