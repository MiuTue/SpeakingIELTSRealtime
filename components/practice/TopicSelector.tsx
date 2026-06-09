"use client";

type Props = {
  topics: string[];
  value: string;
  onChange: (topic: string) => void;
};

export function TopicSelector({ topics, value, onChange }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--navy)]">Topic</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-sm"
      >
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>
    </label>
  );
}
