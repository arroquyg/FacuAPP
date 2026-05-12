function Skel({ className }: { className: string }) {
  return <div className={`bg-stone-200 rounded-lg animate-pulse ${className}`} />;
}

export default function AnimalesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <Skel className="h-9 w-40 mb-2" />
          <Skel className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-24" />
          <Skel className="h-9 w-24" />
          <Skel className="h-9 w-32" />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Skel className="h-9 w-48" />
        <Skel className="h-9 w-36" />
        <Skel className="h-9 w-36" />
        <Skel className="h-9 w-36" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3 bg-stone-50 border-b border-stone-100">
          {[...Array(6)].map((_, i) => (
            <Skel key={i} className="h-3 w-20" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 last:border-0">
            <Skel className="h-4 w-32" />
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-24" />
            <Skel className="h-4 w-24" />
            <Skel className="h-4 w-16" />
            <Skel className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
