import { PracticeRoom } from "@/components/practice/PracticeRoom";
import type { PracticeMode } from "@/lib/ielts/sessionMachine";
import { defaultRealtimeVoice, isRealtimeVoice } from "@/lib/realtime/voices";
import { requireUserPage } from "@/lib/server/authGuards";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PracticeRoomPage({ params, searchParams }: Props) {
  await requireUserPage();
  const { sessionId } = await params;
  const query = await searchParams;
  const mode = readQuery(query.mode, "PART1") as PracticeMode;
  const topic = readQuery(query.topic, "Work or study");
  const targetBand = Number(readQuery(query.targetBand, "7"));
  const queryVoice = readQuery(query.voice, defaultRealtimeVoice);
  const voice = isRealtimeVoice(queryVoice) ? queryVoice : defaultRealtimeVoice;

  return <PracticeRoom sessionId={sessionId} mode={mode} topic={topic} targetBand={targetBand} voice={voice} />;
}

function readQuery(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}
