import { requireUser, prisma } from "@/lib/auth";
import { Role } from "@prisma/client";
import FounderProfileForm from "./FounderProfileForm";
import MentorProfileForm from "./MentorProfileForm";
import AvailabilityManager from "./AvailabilityManager";

export default async function ProfilePage() {
  const user = await requireUser();
  const isFounder = user.role === Role.FOUNDER;

  let founderData = null;
  let mentorData = null;

  if (isFounder && user.founder) {
    const founder = await prisma.founderProfile.findUnique({
      where: { id: user.founder.id },
      include: { needs: true },
    });
    if (founder) {
      founderData = {
        startupName: founder.startupName || "",
        pitch: founder.pitch || "",
        domain: founder.domain || "EdTech",
        stage: founder.stage || "Seed",
        needsNote: founder.needsNote,
        needs: founder.needs.map(n => n.skill),
      };
    }
  } else if (!isFounder && user.mentor) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: user.mentor.id },
      include: {
        domains: true,
        stages: true,
        skills: true,
        availability: true,
      },
    });
    if (mentor) {
      mentorData = {
        profile: {
          headline: mentor.headline || "",
          bio: mentor.bio || "",
          expertiseNote: mentor.expertiseNote,
          domains: mentor.domains.map(d => d.domain),
          stages: mentor.stages.map(s => s.stage),
          skills: mentor.skills.map(s => s.skill),
        },
        availability: mentor.availability,
      };
    }
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto w-full space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Settings</h1>
        <p className="text-[var(--foreground)]/60 text-sm">
          Logged in as <span className="font-semibold text-[var(--foreground)]">{user.name}</span> ({user.email}) · <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-[var(--foreground)]/5">{user.role}</span>
        </p>
      </div>

      {isFounder && founderData && (
        <section className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold mb-6">Founder & Startup Profile</h2>
          <FounderProfileForm initial={founderData} />
        </section>
      )}

      {!isFounder && mentorData && (
        <div className="space-y-10">
          <section className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold mb-6">Mentor Profile & Expertise</h2>
            <MentorProfileForm initial={mentorData.profile} />
          </section>

          <section className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl p-6 sm:p-8 shadow-xs">
            <AvailabilityManager slots={mentorData.availability} />
          </section>
        </div>
      )}
    </div>
  );
}