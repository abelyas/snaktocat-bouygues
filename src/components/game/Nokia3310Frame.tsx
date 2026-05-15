'use client';

interface Nokia3310FrameProps {
  children: React.ReactNode;
  screenWidth: number;
  screenHeight: number;
  onDpadUp?: () => void;
  onDpadDown?: () => void;
  onDpadLeft?: () => void;
  onDpadRight?: () => void;
}

const KEYPAD_LABELS = [
  ['1', ''], ['2', 'abc'], ['3', 'def'],
  ['4', 'ghi'], ['5', 'jkl'], ['6', 'mno'],
  ['7', 'pqrs'], ['8', 'tuv'], ['9', 'wxyz'],
  ['*', '+'], ['0', '⌂'], ['#', ''],
];

export default function Nokia3310Frame({
  children,
  screenWidth,
  screenHeight,
  onDpadUp,
  onDpadDown,
  onDpadLeft,
  onDpadRight,
}: Nokia3310FrameProps) {
  return (
    <div className="relative select-none" style={{ width: 320 }}>
      {/* Phone body: dark blue with rounded top, straighter bottom */}
      <div
        style={{
          background: 'linear-gradient(180deg, #2b3a4e 0%, #1e2d3d 40%, #1a2738 100%)',
          borderRadius: '40px 40px 32px 32px',
          padding: '12px 20px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          border: '2px solid #0f1923',
        }}
      >
        {/* Speaker grille holes */}
        <div className="flex justify-center gap-[5px] mb-2 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[4px] h-[4px] rounded-full bg-[#0a1520]" style={{
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.8)',
            }} />
          ))}
        </div>

        {/* NOKIA brand */}
        <div className="text-center mb-3">
          <span
            className="font-bold tracking-[0.25em] uppercase select-none"
            style={{
              fontSize: '13px',
              color: '#8899aa',
              textShadow: '0 1px 0 rgba(0,0,0,0.5)',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            NOKIA
          </span>
        </div>

        {/* Screen area with silver bezel */}
        <div
          style={{
            background: 'linear-gradient(145deg, #b8bcc0 0%, #8e9399 30%, #a0a5aa 60%, #c0c4c8 100%)',
            borderRadius: '12px',
            padding: '10px',
            margin: '0 8px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Green LCD screen */}
          <div
            style={{
              background: '#8bac0f',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
              width: screenWidth,
              height: screenHeight,
              margin: '0 auto',
            }}
          >
            {children}
          </div>
        </div>

        {/* Soft keys and D-pad area */}
        <div className="mt-4 px-2">
          {/* Two soft key buttons + navi button */}
          <div className="flex justify-between items-center mb-2 px-4">
            <button className="w-12 h-6 rounded-md" style={{
              background: 'linear-gradient(180deg, #3d5060 0%, #2a3a48 100%)',
              boxShadow: '0 2px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid #1a2530',
            }} />
            <button className="w-12 h-6 rounded-md" style={{
              background: 'linear-gradient(180deg, #3d5060 0%, #2a3a48 100%)',
              boxShadow: '0 2px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid #1a2530',
            }} />
          </div>

          {/* D-pad / Navigation circle */}
          <div className="flex justify-center mb-3">
            <div className="relative" style={{ width: 80, height: 80 }}>
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(145deg, #8e9399 0%, #6a7078 50%, #8e9399 100%)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  border: '2px solid #555c63',
                }}
              />
              {/* Center blue dot (like real 3310) */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 12,
                  height: 12,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'linear-gradient(145deg, #4db8ff, #0088cc)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
              {/* Clickable D-pad zones */}
              <button
                onClick={onDpadUp}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center opacity-0 active:opacity-30 active:bg-white rounded-full cursor-pointer z-10"
                aria-label="Up"
              />
              <button
                onClick={onDpadDown}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center opacity-0 active:opacity-30 active:bg-white rounded-full cursor-pointer z-10"
                aria-label="Down"
              />
              <button
                onClick={onDpadLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-0 active:opacity-30 active:bg-white rounded-full cursor-pointer z-10"
                aria-label="Left"
              />
              <button
                onClick={onDpadRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-0 active:opacity-30 active:bg-white rounded-full cursor-pointer z-10"
                aria-label="Right"
              />
            </div>
          </div>

          {/* Numeric keypad: 4x3 grid */}
          <div className="grid grid-cols-3 gap-[6px] px-4">
            {KEYPAD_LABELS.map(([num, letters], i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-[10px] py-[6px]"
                style={{
                  background: 'linear-gradient(180deg, #b8bcc0 0%, #8e9399 40%, #a0a5aa 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                  border: '1px solid #6a7078',
                  minHeight: 32,
                }}
              >
                <span className="text-[#1a2738] font-bold text-sm leading-none">{num}</span>
                {letters && (
                  <span className="text-[#3a4a58] text-[8px] ml-[2px] leading-none">{letters}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
