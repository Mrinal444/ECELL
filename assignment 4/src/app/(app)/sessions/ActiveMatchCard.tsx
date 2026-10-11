import { getBookableSlots } from "@/lib/availability";
import SlotPicker from "./SlotPicker";

interface Match {
  id: string;
  score: number;
  reason: string;
  mentorId: string;
  founderId: string;
}

interface Props {
  req: Match;
  otherParty: string;
  isFounder: boolean;
  mentorId: string;
  isMentor: boolean;
}

export default async function ActiveMatchCard({ req, otherParty, isFounder, mentorId }: Props) {
  const slots = isFounder ? await getBookableSlots(mentorId) : [];

  return (
    <div key={req.id} className="bg-[var(--background)] border border-[var(--foreground)]/10 p-4 rounded-xl flex items-center justify-between gap-4">
      <div>
        <h4 className="font-bold">{otherParty}</h4>
        <p className="text-xs text-[var(--foreground)]/60">Match Score: {req.score}%</p>
      </div>
      {isFounder ? (
        <SlotPicker matchRequestId={req.id} slots={slots} />
      ) : (
        <div className="text-sm border border-[var(--foreground)]/10 px-3 py-1 bg-[var(--foreground)]/5 rounded-full text-[var(--foreground)]/60 font-medium">
          Waiting for founder
        </div>
      )}
    </div>
  );
}