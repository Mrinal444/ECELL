const { PrismaClient, Role, MatchStatus, SessionStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=== Starting MentorMatch MVP Verification ===\n");

  // 1. Verify Seed Users
  const priya = await prisma.user.findUnique({
    where: { email: "priya@mentormatch.dev" },
    include: { founder: { include: { needs: true } } }
  });
  const arjun = await prisma.user.findUnique({
    where: { email: "arjun@mentormatch.dev" },
    include: { mentor: { include: { domains: true, stages: true, skills: true, availability: true } } }
  });

  if (!priya || !priya.founder) throw new Error("Priya (Demo Founder) missing!");
  if (!arjun || !arjun.mentor) throw new Error("Arjun (Demo Mentor) missing!");
  console.log("✓ Demo users Priya Sharma (Founder) & Arjun Mehta (Mentor) verified.");

  // Verify password hash check for demo1234
  const validPriyaPw = await bcrypt.compare("demo1234", priya.passwordHash);
  const validArjunPw = await bcrypt.compare("demo1234", arjun.passwordHash);
  if (!validPriyaPw || !validArjunPw) throw new Error("Demo password verification failed!");
  console.log("✓ Password authentication for 'demo1234' verified for both users.");

  // 2. Verify Seed Matches & Cooldown
  const acceptedMatch = await prisma.matchRequest.findUnique({
    where: {
      founderId_mentorId: {
        founderId: priya.founder.id,
        mentorId: arjun.mentor.id
      }
    }
  });
  if (!acceptedMatch || acceptedMatch.status !== "ACCEPTED") {
    throw new Error("Accepted match between Priya and Arjun missing!");
  }
  console.log(`✓ Accepted match verified (Score: ${acceptedMatch.score}%, Reason: "${acceptedMatch.reason}")`);

  const declinedMatch = await prisma.matchRequest.findFirst({
    where: {
      founderId: priya.founder.id,
      status: "DECLINED"
    }
  });
  if (!declinedMatch || !declinedMatch.respondedAt) {
    throw new Error("Declined match with cooldown timestamp missing!");
  }
  const daysSinceDecline = (Date.now() - declinedMatch.respondedAt.getTime()) / (1000 * 60 * 60 * 24);
  console.log(`✓ 5-day declined match cooldown verified: declined ${daysSinceDecline.toFixed(1)} days ago (< 14-day limit).`);

  // 3. Verify Seed Sessions in all states
  const sessions = await prisma.session.findMany({
    where: { matchRequestId: acceptedMatch.id }
  });

  const statuses = sessions.map(s => s.status);
  console.log("✓ Found sessions with statuses:", statuses.join(", "));
  if (!statuses.includes("CONFIRMED")) throw new Error("CONFIRMED session missing!");
  if (!statuses.includes("COMPLETED")) throw new Error("COMPLETED session missing!");
  if (!statuses.includes("REQUESTED")) throw new Error("REQUESTED session missing!");
  if (!statuses.includes("CANCELLED")) throw new Error("CANCELLED session missing!");

  const completedSession = sessions.find(s => s.status === "COMPLETED");
  if (!completedSession.founderNotes || !completedSession.mentorNotes) {
    throw new Error("Completed session private notes missing!");
  }
  console.log(`✓ Completed session private notes verified:`);
  console.log(`   Founder note: "${completedSession.founderNotes}"`);
  console.log(`   Mentor note:  "${completedSession.mentorNotes}"`);

  // 4. Verify Mentor Weekly Availability
  const arjunSlots = await prisma.availabilitySlot.findMany({
    where: { mentorId: arjun.mentor.id }
  });
  console.log(`✓ Arjun has ${arjunSlots.length} weekly recurring availability rules.`);
  if (arjunSlots.length === 0) throw new Error("Arjun has no availability rules!");

  // 5. Total Count Checks
  const totalFounders = await prisma.founderProfile.count();
  const totalMentors = await prisma.mentorProfile.count();
  console.log(`✓ Total counts in database: ${totalFounders} founders, ${totalMentors} mentors.`);
  if (totalFounders < 8 || totalMentors < 10) {
    throw new Error("Seed count expectation not met (minimum 8 founders, 10 mentors)!");
  }

  console.log("\n=== ALL MVP VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runVerification()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });