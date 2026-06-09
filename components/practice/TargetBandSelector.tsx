"use client";

type Props = {
  value: number;
  onChange: (band: number) => void;
};

export function TargetBandSelector({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--navy)]">Target band</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min="4"
          max="9"
          step="0.5"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--magenta)]"
        />
        <span className="w-12 rounded-md bg-[var(--navy)] px-2 py-1 text-center text-sm font-semibold text-white">
          {value}
        </span>
      </div>
    </label>
  );
}
