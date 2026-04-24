import { SkeletonTable } from '@/components/alumco/Skeletons'

export default function CertificadosLoading() {
  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">
      <div className="flex justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-100 rounded-full" />
      </div>
      <SkeletonTable rows={8} />
    </div>
  )
}
