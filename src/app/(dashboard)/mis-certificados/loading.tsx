export default function MisCertificadosLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-44 bg-slate-200 rounded" />
        <div className="h-4 w-60 bg-slate-100 rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 animate-pulse border-l-4 border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-slate-100 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-9 w-16 bg-slate-100 rounded-lg" />
                <div className="h-9 w-24 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
