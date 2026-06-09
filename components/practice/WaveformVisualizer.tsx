"use client";

type Props = {
  active: boolean;
  volume?: number;
};

export function WaveformVisualizer({ active, volume = 0.2 }: Props) {
  return (
    <div className="flex h-20 items-center justify-center gap-1 rounded-md bg-slate-950 p-4">
      {Array.from({ length: 28 }).map((_, index) => {
        const height = active ? 18 + ((index * 11) % 34) * (0.4 + volume) : 10;
        return (
          <span
            key={index}
            className="w-1 rounded-full bg-gradient-to-t from-teal-300 to-pink-400 transition-all"
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
