export default function ShipmentImportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-slate-200" />
        <div className="h-4 w-72 rounded-lg bg-slate-100" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-5 w-32 rounded-lg bg-slate-200" />
        <div className="space-y-3">
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  )
}
