import { Minus, Square, X, Triangle } from 'lucide-react';

export function TitleBar() {
  return (
    <div className="h-10 w-full bg-[#050505] border-b border-white/5 flex items-center justify-between select-none drag-region z-50 relative">
      {/* App Title / Logo Area */}
      <div className="flex items-center gap-3 px-4">
        <Triangle className="w-4 h-4 text-[#00f3ff] fill-[#00f3ff]/20" />
        <span className="font-display text-xs font-bold tracking-[0.2em] text-white/80 mt-0.5">
          TRIAD
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex h-full no-drag-region">
        <button 
          onClick={() => (window as any).electronAPI?.minimize()}
          className="h-full px-4 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => (window as any).electronAPI?.maximize()}
          className="h-full px-4 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => (window as any).electronAPI?.close()}
          className="h-full px-4 hover:bg-[#ff003c] text-white/50 hover:text-white transition-colors flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
