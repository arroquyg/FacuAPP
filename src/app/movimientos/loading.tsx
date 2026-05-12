function Skel({ className }: { className: string }) {
  return <div className={`bg-stone-200 rounded-lg animate-pulse ${className}`} />;
}

export default function MovimientosLoading() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-5">
        <Skel className="h-9 w-48 mb-2" />
        <Skel className="h-4 w-64" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <Skel className="h-5 w-48" />
        <Skel className="h-10 w-full" />
        <Skel className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skel className="h-10" />
          <Skel className="h-10" />
          <Skel className="h-10" />
        </div>
        <Skel className="h-10 w-44" />
      </div>

      {/* Historial */}
      <div>
        <Skel className="h-6 w-40 mb-4" />
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {[...Array(6)].map((_, i) => (
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
