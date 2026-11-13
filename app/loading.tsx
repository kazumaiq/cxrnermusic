export default function GlobalLoading() {
  return (
    <div className="min-h-[80vh] pt-28 sm:pt-36 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Cyber Skeleton Header */}
      <div className="space-y-4 mb-10 animate-pulse">
        <div className="h-4 w-44 rounded-full bg-white/10" />
        <div className="h-10 sm:h-12 w-72 sm:w-96 rounded-2xl bg-gradient-to-r from-[#8737FF]/25 via-white/10 to-transparent" />
        <div className="h-4 w-full max-w-xl rounded-full bg-white/5" />
      </div>

      {/* Glowing Cyber Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-3xl border border-white/10 bg-[#0b0b14]/70 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded-full bg-white/10" />
              <div className="h-8 w-8 rounded-xl bg-[#8737FF]/20" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-28 rounded-lg bg-white/15" />
              <div className="h-3 w-40 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Card */}
      <div className="mt-6 h-64 rounded-3xl border border-white/10 bg-[#0b0b14]/70 p-6 sm:p-8 animate-pulse flex flex-col justify-center items-center gap-3">
        <div className="flex items-end gap-1 h-5">
          <span className="w-1 bg-[#8737FF] rounded-full animate-pulse h-3" />
          <span className="w-1 bg-[#00F0FF] rounded-full animate-pulse h-5" />
          <span className="w-1 bg-[#B46BFF] rounded-full animate-pulse h-2" />
          <span className="w-1 bg-[#00F0FF] rounded-full animate-pulse h-4" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#D9D9E2]/60">
          // ЗАГРУЗКА МОДУЛЯ CXRNER...
        </span>
      </div>
    </div>
  );
}
