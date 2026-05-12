function Skel({ className }: { className: string }) {
  return <div className={`bg-stone-200 rounded-lg animate-pulse ${className}`} />;
}

export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <Skel className="h-9 w-48 mb-2" />
        <Skel className="h-4 w-64" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-2 px-2">
        {[...Array(3)].map((_, i) => <Skel key={i} className="h-10 w-28" />)}
      </div>

      {/* List items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between">
            <Skel className="h-5 w-40" />
            <div className="flex gap-2">
              <Skel className="h-8 w-16" />
              <Skel className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
