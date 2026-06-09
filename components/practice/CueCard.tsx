type Props = {
  topic: string;
  visible: boolean;
};

export function CueCard({ topic, visible }: Props) {
  if (!visible) return null;
  const lines = topic.split("\n").filter(Boolean);

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className={index === 0 ? "font-semibold" : "mt-1"}>
          {line}
        </p>
      ))}
    </div>
  );
}
