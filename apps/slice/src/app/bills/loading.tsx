export default function BillsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-8 w-40 bg-slice-border/60 rounded-lg" />
        <div className="h-4 w-32 bg-slice-border/40 rounded-lg mt-2" />
      </div>
      <div className="h-14 w-full bg-slice-border/40 rounded-2xl" />
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 w-full bg-white border border-slice-border rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
