function Skel({ className }: { className: string }) {
  return <div className={`bg-stone-200 rounded-lg animate-pulse ${className}`} />;
}

export default function TransaccionesLoading() {
  return (
    <div className="space-y-8">
      <Skel className="h-9 w-48" />

      {/* Form skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <Skel className="h-5 w-48" />
        <div className="flex gap-3">
          <Skel className="h-10 w-24" />
          <Skel className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skel key={i} className="h-10" />)}
        </div>
        <Skel className="h-10 w-full" />
        <Skel className="h-24 w-full" />
        <Skel className="h-10 w-44" />
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3 bg-stone-50 border-b border-stone-100">
          {[...Array(5)].map((_, i) => <Skel key={i} className="h-3 w-20" />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 last:border-0">
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-28" />
            <Skel className="h-4 w-24" />
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
