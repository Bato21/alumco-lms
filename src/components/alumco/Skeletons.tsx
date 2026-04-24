export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6 animate-pulse ${className}`}>
      <div className="h-10 w-10 rounded-full bg-slate-100 mb-4" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-8 w-16 bg-slate-100 rounded" />
    </div>
  )
}

export function SkeletonStatsRow() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-5 lg:px-6 py-4 border-b border-slate-50 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 bg-slate-100 rounded" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-16 bg-slate-100 rounded-full hidden lg:block" />
      <div className="h-6 w-12 bg-slate-100 rounded-full hidden lg:block" />
    </div>
  )
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 lg:px-6 py-4 border-b border-slate-100 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      {[...Array(rows)].map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#1A2F6B] to-[#2B4FA0] h-48 lg:h-56 animate-pulse flex items-center px-6 lg:px-10">
      <div className="space-y-3 max-w-md">
        <div className="h-3 w-32 bg-white/20 rounded" />
        <div className="h-8 w-80 bg-white/20 rounded" />
        <div className="h-3 w-56 bg-white/20 rounded" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-36 bg-white/20 rounded-lg" />
          <div className="h-10 w-28 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonCourseCard() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="h-2 w-full bg-slate-100 rounded-full mt-4" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
          <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfileCard() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-24 w-24 rounded-full bg-slate-100" />
          <div className="h-4 w-28 bg-slate-100 rounded" />
          <div className="h-5 w-20 bg-slate-100 rounded-full" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-2 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
