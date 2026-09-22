export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse" aria-label="กำลังโหลดข้อมูล">
      <div className="h-28 rounded-2xl bg-slate-200/80" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-9 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="h-6 w-52 rounded bg-slate-200" />
          <div className="h-52 rounded-2xl bg-white border border-slate-200" />
        </div>
      ))}
    </div>
  )
}
