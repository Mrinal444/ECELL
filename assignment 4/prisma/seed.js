const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.mentorSkill.deleteMany();
  await prisma.mentorStage.deleteMany();
  await prisma.mentorDomain.deleteMany();
  await prisma.founderNeed.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.founderProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Priya Sharma (Demo Founder)
  const priya = await prisma.user.create({
    data: {
      email: "priya@mentormatch.dev",
      name: "Priya Sharma",
      passwordHash,
      role: "FOUNDER",
      founder: {
        create: {
          startupName: "EduScale",
          pitch: "Affordable upskilling for Tier-2 engineering students",
          domain: "EdTech",
          stage: "Seed",
          needsNote: "Need help scaling GTM and structuring seed round",
          onboarded: true,
          needs: {
            create: [{ skill: "GoToMarket" }, { skill: "Fundraising" }]
          }
        }
      }
    },
    include: { founder: true }
  });

  // Arjun Mehta (Demo Mentor)
  const arjun = await prisma.user.create({
    data: {
      email: "arjun@mentormatch.dev",
      name: "Arjun Mehta",
      passwordHash,
      role: "MENTOR",
      mentor: {
        create: {
          headline: "Ex-VP Product at EdTech Unicorn, Angel Investor",
          bio: "Scaled product from 0 to 10M MAU. Love helping early-stage founders nail PMF.",
          expertiseNote: "GTM playbooks, product strategy, pricing tiers",
          onboarded: true,
          domains: { create: [{ domain: "EdTech" }, { domain: "SaaS" }] },
          stages: { create: [{ stage: "PreSeed" }, { stage: "Seed" }] },
          skills: { create: [{ skill: "GoToMarket" }, { skill: "Product" }, { skill: "Pricing" }] },
          availability: {
            create: [
              { weekday: 1, startMin: 600, endMin: 660 },
              { weekday: 3, startMin: 840, endMin: 900 },
              { weekday: 5, startMin: 960, endMin: 1020 }
            ]
          }
        }
      }
    },
    include: { mentor: true }
  });

  // 7 other founders
  const founderData = [
    { name: "Rohan Varma", email: "rohan@finflow.io", startup: "FinFlow", pitch: "Automated treasury for cross-border SMBs", domain: "FinTech", stage: "PreSeed", needs: ["TechArchitecture", "Legal"] },
    { name: "Ananya Iyer", email: "ananya@healthpulse.ai", startup: "HealthPulse", pitch: "Continuous vitals monitoring using ambient sensors", domain: "HealthTech", stage: "Idea", needs: ["Product", "Hiring"] },
    { name: "Vikram Das", email: "vikram@neuralops.dev", startup: "NeuralOps", pitch: "Observability for local LLM inference pipelines", domain: "AI", stage: "Seed", needs: ["Sales", "Pricing"] },
    { name: "Sneha Reddy", email: "sneha@carbonledger.earth", startup: "CarbonLedger", pitch: "Verifiable supply chain carbon accounting", domain: "Climate", stage: "PreSeed", needs: ["Fundraising", "GoToMarket"] },
    { name: "Karan Johar", email: "karan@snackbox.co", startup: "SnackBox", pitch: "D2C personalized functional nutrition bites", domain: "Consumer", stage: "Growth", needs: ["Branding", "Operations"] },
    { name: "Devika Sen", email: "devika@flowdesk.app", startup: "FlowDesk", pitch: "Modular internal tooling for logistics brokers", domain: "SaaS", stage: "Seed", needs: ["TechArchitecture", "Sales"] },
    { name: "Aditya Nair", email: "aditya@credsecure.io", startup: "CredSecure", pitch: "Real-time synthetic identity fraud prevention", domain: "FinTech", stage: "Idea", needs: ["TechArchitecture", "Legal"] },
  ];

  const founders = [priya];
  for (const f of founderData) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash,
        role: "FOUNDER",
        founder: {
          create: {
            startupName: f.startup,
            pitch: f.pitch,
            domain: f.domain,
            stage: f.stage,
            onboarded: true,
            needs: {
              create: f.needs.map(n => ({ skill: n }))
            }
          }
        }
      },
      include: { founder: true }
    });
    founders.push(user);
  }

  // 9 other mentors
  const mentorData = [
    { name: "Sunita Rao", email: "sunita@mentors.dev", headline: "Former Partner at SeedFund", domains: ["FinTech", "SaaS"], stages: ["PreSeed", "Seed"], skills: ["Fundraising", "Legal"] },
    { name: "Kabir Anand", email: "kabir@mentors.dev", headline: "CTO @ HealthUnicorn", domains: ["HealthTech", "AI"], stages: ["Seed", "Growth"], skills: ["TechArchitecture", "Hiring"] },
    { name: "Tara Kapoor", email: "tara@mentors.dev", headline: "Chief Growth Officer, ex-D2C Unicorn", domains: ["Consumer"], stages: ["PreSeed", "Growth"], skills: ["Branding", "GoToMarket"] },
    { name: "Manoj Pillai", email: "manoj@mentors.dev", headline: "Principal Architect, Distributed AI Systems", domains: ["AI", "SaaS"], stages: ["Idea", "PreSeed"], skills: ["TechArchitecture", "Product"] },
    { name: "Ritika Goyal", email: "ritika@mentors.dev", headline: "Head of Sales EMEA, SaaS Corp", domains: ["SaaS", "FinTech"], stages: ["Seed", "Growth"], skills: ["Sales", "Pricing"] },
    { name: "Farhan Qureshi", email: "farhan@mentors.dev", headline: "ClimateTech EIR & Angel", domains: ["Climate", "SaaS"], stages: ["Idea", "Seed"], skills: ["Fundraising", "Operations"] },
    { name: "Meera Deshmukh", email: "meera@mentors.dev", headline: "VP People & Culture, Series C FinTech", domains: ["FinTech"], stages: ["Seed", "Growth"], skills: ["Hiring", "Operations"] },
    { name: "Alok Bansal", email: "alok@mentors.dev", headline: "Founder (2x exits), Enterprise SaaS", domains: ["SaaS", "EdTech"], stages: ["PreSeed", "Seed"], skills: ["GoToMarket", "Fundraising"] },
    { name: "Zoya Akhtar", email: "zoya@mentors.dev", headline: "Product Lead, Consumer Tech", domains: ["Consumer", "EdTech"], stages: ["Idea", "PreSeed"], skills: ["Product", "Branding"] },
  ];

  const mentors = [arjun];
  for (const m of mentorData) {
    const user = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        passwordHash,
        role: "MENTOR",
        mentor: {
          create: {
            headline: m.headline,
            bio: "Passionate about working hands-on with early founders.",
            onboarded: true,
            domains: { create: m.domains.map(d => ({ domain: d })) },
            stages: { create: m.stages.map(s => ({ stage: s })) },
            skills: { create: m.skills.map(s => ({ skill: s })) },
            availability: {
              create: [
                { weekday: 2, startMin: 600, endMin: 660 },
                { weekday: 4, startMin: 900, endMin: 960 }
              ]
            }
          }
        }
      },
      include: { mentor: true }
    });
    mentors.push(user);
  }

  const priyaF = priya.founder;
  const arjunM = arjun.mentor;

  // Accepted match
  const acceptedMatch = await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: arjunM.id,
      status: "ACCEPTED",
      score: 85,
      reason: "Same domain (EdTech) · supports Seed stage · covers GoToMarket",
      message: "Hey Arjun! Looking forward to discussing our unit economics & GTM.",
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // CONFIRMED Tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(10, 0, 0, 0);

  await prisma.session.create({
    data: {
      matchRequestId: acceptedMatch.id,
      founderId: priyaF.id,
      mentorId: arjunM.id,
      startsAt: tomorrow,
      endsAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      status: "CONFIRMED",
      topic: "Deep dive: GTM motion & sales cycle"
    }
  });

  // COMPLETED last week
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setUTCHours(10, 0, 0, 0);

  await prisma.session.create({
    data: {
      matchRequestId: acceptedMatch.id,
      founderId: priyaF.id,
      mentorId: arjunM.id,
      startsAt: lastWeek,
      endsAt: new Date(lastWeek.getTime() + 60 * 60 * 1000),
      status: "COMPLETED",
      topic: "Initial deck feedback & pricing review",
      founderNotes: "Super insightful session. Must restructure our tiered subscription model.",
      mentorNotes: "Strong conviction founder. Needs to be more conservative on early churn."
    }
  });

  // REQUESTED upcoming
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setUTCHours(14, 0, 0, 0);

  await prisma.session.create({
    data: {
      matchRequestId: acceptedMatch.id,
      founderId: priyaF.id,
      mentorId: arjunM.id,
      startsAt: dayAfterTomorrow,
      endsAt: new Date(dayAfterTomorrow.getTime() + 60 * 60 * 1000),
      status: "REQUESTED",
      topic: "Follow-up sync on investor outreach"
    }
  });

  // CANCELLED
  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 14);

  await prisma.session.create({
    data: {
      matchRequestId: acceptedMatch.id,
      founderId: priyaF.id,
      mentorId: arjunM.id,
      startsAt: prevDate,
      endsAt: new Date(prevDate.getTime() + 60 * 60 * 1000),
      status: "CANCELLED",
      topic: "Ad-hoc sync",
      cancelledBy: "founder"
    }
  });

  // PENDING match
  const sunitaM = mentors[1].mentor;
  await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: sunitaM.id,
      status: "PENDING",
      score: 65,
      reason: "Adjacent domain (EdTech ↔ SaaS) · supports Seed stage · covers Fundraising",
      message: "Hi Sunita, would love your advice on preparing for a priced seed round."
    }
  });

  // DECLINED match with 5-day cooldown
  const kabirM = mentors[2].mentor;
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: kabirM.id,
      status: "DECLINED",
      score: 55,
      reason: "Adjacent domain · supports nearby stage",
      message: "Connecting regarding tech infra.",
      respondedAt: fiveDaysAgo,
      createdAt: new Date(fiveDaysAgo.getTime() - 24 * 60 * 60 * 1000)
    }
  });

  console.log("Database seeded successfully via plain Node script.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
