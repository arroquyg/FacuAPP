function Skel({ className }: { className: string }) {
  return <div className={`bg-stone-200 rounded-lg animate-pulse ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-5">
        <Skel className="h-9 w-72 mb-2" />
        <Skel className="h-4 w-48" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <Skel className="h-3 w-24 mb-3" />
            <Skel className="h-10 w-16" />
          </div>
        ))}
      </div>

      {/* Campos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skel className="h-5 w-20" />
          <Skel className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-3">
              <Skel className="h-5 w-32" />
              <Skel className="h-4 w-24" />
              <Skel className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Movimientos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skel className="h-5 w-40" />
          <Skel className="h-4 w-20" />
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 last:border-0">
              <Skel className="h-4 w-20" />
              <Skel className="h-4 w-32" />
              <Skel className="h-4 w-24" />
              <Skel className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
