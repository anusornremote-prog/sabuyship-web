export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="กำลังโหลดข้อมูล">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-white border border-slate-200" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-white border border-slate-200" />
    </div>
  )
}
