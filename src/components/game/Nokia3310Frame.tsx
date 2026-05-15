'use client';

interface Nokia3310FrameProps {
  children: React.ReactNode;
  screenWidth: number;
  screenHeight: number;
}

export default function Nokia3310Frame({ children, screenWidth, screenHeight }: Nokia3310FrameProps) {
  const padX = 40;
  const padTop = 80;
  const padBottom = 120;
  const totalW = screenWidth + padX * 2;
  const totalH = screenHeight + padTop + padBottom;
  const borderRadius = 28;

  return (
    <div className="relative flex items-center justify-center" style={{ width: totalW, height: totalH }}>
      {/* Phone body */}
      <div
        className="absolute inset-0 rounded-[28px] border-[3px] border-[#555]"
        style={{
          background: 'linear-gradient(145deg, #c8c8c8 0%, #a0a0a0 30%, #888 60%, #a0a0a0 100%)',
          borderRadius,
        }}
      />

      {/* Top speaker grille */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#555]" />
        ))}
      </div>

      {/* Brand text */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <span className="text-[#333] font-bold text-xs tracking-[0.3em] uppercase select-none">NOKIA</span>
      </div>

      {/* Screen bezel */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: padTop - 8,
          left: padX - 8,
          width: screenWidth + 16,
          height: screenHeight + 16,
          borderRadius: 8,
          background: '#2a2a2a',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {/* Inner screen area */}
        <div
          className="absolute"
          style={{
            top: 8,
            left: 8,
            width: screenWidth,
            height: screenHeight,
          }}
        >
          {children}
        </div>
      </div>

      {/* Navigation cluster */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ top: padTop + screenHeight + 20 }}
      >
        {/* D-pad circle */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-[#666] border-2 border-[#555] shadow-inner" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-transparent border-b-[#333]" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-transparent border-t-[#333]" />
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-r-[7px] border-transparent border-r-[#333]" />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-transparent border-l-[#333]" />
          </div>
        </div>

        {/* Bottom row of small buttons */}
        <div className="flex gap-4 mt-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-4 h-2.5 rounded-sm bg-[#666] border border-[#555]" />
          ))}
        </div>
      </div>
    </div>
  );
}
