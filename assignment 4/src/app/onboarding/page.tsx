import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import FounderForm from "./FounderForm";
import MentorForm from "./MentorForm";

const domainsList = ["FinTech", "HealthTech", "EdTech", "AI", "Climate", "Consumer", "SaaS"];
const stagesList = ["Idea", "PreSeed", "Seed", "Growth"];
const skillsList = ["Fundraising", "GoToMarket", "Product", "Hiring", "TechArchitecture", "Pricing", "Sales", "Branding", "Legal", "Operations"];

export default async function OnboardingPage() {
  const user = await requireUser();
  const isFounder = user.role === Role.FOUNDER;

  if (isFounder && user.founder?.onboarded) redirect("/discover");
  if (!isFounder && user.mentor?.onboarded) redirect("/discover");

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Complete your profile</h1>
      <p className="text-[var(--foreground)]/60 mb-8">
        We use this to calculate match scores and find the best fit.
      </p>

      {isFounder ? <FounderForm domainsList={domainsList} stagesList={stagesList} skillsList={skillsList} /> : <MentorForm domainsList={domainsList} stagesList={stagesList} skillsList={skillsList} />}
    </div>
  );
}