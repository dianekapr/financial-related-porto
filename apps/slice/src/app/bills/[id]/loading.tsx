export default function BillDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-7 w-40 bg-slice-border/60 rounded-lg" />
          <div className="h-4 w-24 bg-slice-border/40 rounded-lg mt-2" />
        </div>
        <div className="h-7 w-24 bg-slice-border/60 rounded-lg" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 w-28 shrink-0 bg-white border border-slice-border rounded-2xl" />
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-slice-border overflow-hidden">
        <div className="h-16 bg-slice-receipt border-b border-slice-border" />
        <div className="divide-y divide-slice-border">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-16 px-5 py-3.5" />
          ))}
        </div>
      </div>
    </div>
  )
}
