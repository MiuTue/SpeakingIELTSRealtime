import { PracticeSelection } from "@/components/practice/PracticeSelection";
import { requireUserPage } from "@/lib/server/authGuards";

export default async function PracticePage() {
  await requireUserPage();
  return <PracticeSelection />;
}
