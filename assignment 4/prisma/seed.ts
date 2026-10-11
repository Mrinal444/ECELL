import { PrismaClient, Role, Domain, Stage, Skill, MatchStatus, SessionStatus } from "@prisma/client";
import { hash } from "bcryptjs";

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

  const passwordHash = await hash("demo1234", 10);

  // 1. Priya (Demo Founder)
  const priya = await prisma.user.create({
    data: {
      email: "priya@mentormatch.dev",
      name: "Priya Sharma",
      passwordHash,
      role: Role.FOUNDER,
      founder: {
        create: {
          startupName: "EduScale",
          pitch: "Affordable upskilling for Tier-2 engineering students",
          domain: Domain.EdTech,
          stage: Stage.Seed,
          needsNote: "Need help scaling GTM and structuring seed round",
          onboarded: true,
          needs: {
            create: [{ skill: Skill.GoToMarket }, { skill: Skill.Fundraising }]
          }
        }
      }
    },
    include: { founder: true }
  });

  // 2. Arjun (Demo Mentor)
  const arjun = await prisma.user.create({
    data: {
      email: "arjun@mentormatch.dev",
      name: "Arjun Mehta",
      passwordHash,
      role: Role.MENTOR,
      mentor: {
        create: {
          headline: "Ex-VP Product at EdTech Unicorn, Angel Investor",
          bio: "Scaled product from 0 to 10M MAU. Love helping early-stage founders nail PMF.",
          expertiseNote: "GTM playbooks, product strategy, pricing tiers",
          onboarded: true,
          domains: { create: [{ domain: Domain.EdTech }, { domain: Domain.SaaS }] },
          stages: { create: [{ stage: Stage.PreSeed }, { stage: Stage.Seed }] },
          skills: { create: [{ skill: Skill.GoToMarket }, { skill: Skill.Product }, { skill: Skill.Pricing }] },
          availability: {
            create: [
              { weekday: 1, startMin: 600, endMin: 660 }, // Mon 10:00-11:00 AM
              { weekday: 3, startMin: 840, endMin: 900 }, // Wed 2:00-3:00 PM
              { weekday: 5, startMin: 960, endMin: 1020 } // Fri 4:00-5:00 PM
            ]
          }
        }
      }
    },
    include: { mentor: true }
  });

  // Additional 7 Founders (Total 8)
  const founderData = [
    { name: "Rohan Varma", email: "rohan@finflow.io", startup: "FinFlow", pitch: "Automated treasury for cross-border SMBs", domain: Domain.FinTech, stage: Stage.PreSeed, needs: [Skill.TechArchitecture, Skill.Legal] },
    { name: "Ananya Iyer", email: "ananya@healthpulse.ai", startup: "HealthPulse", pitch: "Continuous vitals monitoring using ambient sensors", domain: Domain.HealthTech, stage: Stage.Idea, needs: [Skill.Product, Skill.Hiring] },
    { name: "Vikram Das", email: "vikram@neuralops.dev", startup: "NeuralOps", pitch: "Observability for local LLM inference pipelines", domain: Domain.AI, stage: Stage.Seed, needs: [Skill.Sales, Skill.Pricing] },
    { name: "Sneha Reddy", email: "sneha@carbonledger.earth", startup: "CarbonLedger", pitch: "Verifiable supply chain carbon accounting", domain: Domain.Climate, stage: Stage.PreSeed, needs: [Skill.Fundraising, Skill.GoToMarket] },
    { name: "Karan Johar", email: "karan@snackbox.co", startup: "SnackBox", pitch: "D2C personalized functional nutrition bites", domain: Domain.Consumer, stage: Stage.Growth, needs: [Skill.Branding, Skill.Operations] },
    { name: "Devika Sen", email: "devika@flowdesk.app", startup: "FlowDesk", pitch: "Modular internal tooling for logistics brokers", domain: Domain.SaaS, stage: Stage.Seed, needs: [Skill.TechArchitecture, Skill.Sales] },
    { name: "Aditya Nair", email: "aditya@credsecure.io", startup: "CredSecure", pitch: "Real-time synthetic identity fraud prevention", domain: Domain.FinTech, stage: Stage.Idea, needs: [Skill.TechArchitecture, Skill.Legal] },
  ];

  const founders = [priya];
  for (const f of founderData) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash,
        role: Role.FOUNDER,
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

  // Additional 9 Mentors (Total 10)
  const mentorData = [
    { name: "Sunita Rao", email: "sunita@mentors.dev", headline: "Former Partner at SeedFund", domains: [Domain.FinTech, Domain.SaaS], stages: [Stage.PreSeed, Stage.Seed], skills: [Skill.Fundraising, Skill.Legal] },
    { name: "Kabir Anand", email: "kabir@mentors.dev", headline: "CTO @ HealthUnicorn", domains: [Domain.HealthTech, Domain.AI], stages: [Stage.Seed, Stage.Growth], skills: [Skill.TechArchitecture, Skill.Hiring] },
    { name: "Tara Kapoor", email: "tara@mentors.dev", headline: "Chief Growth Officer, ex-D2C Unicorn", domains: [Domain.Consumer], stages: [Stage.PreSeed, Stage.Growth], skills: [Skill.Branding, Skill.GoToMarket] },
    { name: "Manoj Pillai", email: "manoj@mentors.dev", headline: "Principal Architect, Distributed AI Systems", domains: [Domain.AI, Domain.SaaS], stages: [Stage.Idea, Stage.PreSeed], skills: [Skill.TechArchitecture, Skill.Product] },
    { name: "Ritika Goyal", email: "ritika@mentors.dev", headline: "Head of Sales EMEA, SaaS Corp", domains: [Domain.SaaS, Domain.FinTech], stages: [Stage.Seed, Stage.Growth], skills: [Skill.Sales, Skill.Pricing] },
    { name: "Farhan Qureshi", email: "farhan@mentors.dev", headline: "ClimateTech EIR & Angel", domains: [Domain.Climate, Domain.SaaS], stages: [Stage.Idea, Stage.Seed], skills: [Skill.Fundraising, Skill.Operations] },
    { name: "Meera Deshmukh", email: "meera@mentors.dev", headline: "VP People & Culture, Series C FinTech", domains: [Domain.FinTech], stages: [Stage.Seed, Stage.Growth], skills: [Skill.Hiring, Skill.Operations] },
    { name: "Alok Bansal", email: "alok@mentors.dev", headline: "Founder (2x exits), Enterprise SaaS", domains: [Domain.SaaS, Domain.EdTech], stages: [Stage.PreSeed, Stage.Seed], skills: [Skill.GoToMarket, Skill.Fundraising] },
    { name: "Zoya Akhtar", email: "zoya@mentors.dev", headline: "Product Lead, Consumer Tech", domains: [Domain.Consumer, Domain.EdTech], stages: [Stage.Idea, Stage.PreSeed], skills: [Skill.Product, Skill.Branding] },
  ];

  const mentors = [arjun];
  for (const m of mentorData) {
    const user = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        passwordHash,
        role: Role.MENTOR,
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
                { weekday: 2, startMin: 600, endMin: 660 }, // Tue 10-11am
                { weekday: 4, startMin: 900, endMin: 960 }  // Thu 3-4pm
              ]
            }
          }
        }
      },
      include: { mentor: true }
    });
    mentors.push(user);
  }

  // Relations & Seed Scenarios
  const priyaF = priya.founder!;
  const arjunM = arjun.mentor!;

  // 1. Accepted Match (Priya <-> Arjun)
  const acceptedMatch = await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: arjunM.id,
      status: MatchStatus.ACCEPTED,
      score: 85,
      reason: "Same domain (EdTech) · supports Seed stage · covers GoToMarket",
      message: "Hey Arjun! Looking forward to discussing our unit economics & GTM.",
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // Session: CONFIRMED Tomorrow
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
      status: SessionStatus.CONFIRMED,
      topic: "Deep dive: GTM motion & sales cycle"
    }
  });

  // Session: COMPLETED last week
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
      status: SessionStatus.COMPLETED,
      topic: "Initial deck feedback & pricing review",
      founderNotes: "Super insightful session. Must restructure our tiered subscription model.",
      mentorNotes: "Strong conviction founder. Needs to be more conservative on early churn."
    }
  });

  // Session: REQUESTED (Upcoming)
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
      status: SessionStatus.REQUESTED,
      topic: "Follow-up sync on investor outreach"
    }
  });

  // Session: CANCELLED
  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 14);

  await prisma.session.create({
    data: {
      matchRequestId: acceptedMatch.id,
      founderId: priyaF.id,
      mentorId: arjunM.id,
      startsAt: prevDate,
      endsAt: new Date(prevDate.getTime() + 60 * 60 * 1000),
      status: SessionStatus.CANCELLED,
      topic: "Ad-hoc sync",
      cancelledBy: "founder"
    }
  });

  // 2. Pending Match (Priya -> Sunita Rao)
  const sunitaM = mentors[1].mentor!;
  await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: sunitaM.id,
      status: MatchStatus.PENDING,
      score: 65,
      reason: "Adjacent domain (EdTech ↔ SaaS) · supports Seed stage · covers Fundraising",
      message: "Hi Sunita, would love your advice on preparing for a priced seed round."
    }
  });

  // 3. Declined Match (Priya -> Kabir Anand) with 5-day cooldown active
  const kabirM = mentors[2].mentor!;
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await prisma.matchRequest.create({
    data: {
      founderId: priyaF.id,
      mentorId: kabirM.id,
      status: MatchStatus.DECLINED,
      score: 55,
      reason: "Adjacent domain · supports nearby stage",
      message: "Connecting regarding tech infra.",
      respondedAt: fiveDaysAgo,
      createdAt: new Date(fiveDaysAgo.getTime() - 24 * 60 * 60 * 1000)
    }
  });

  console.log("Database seeded successfully with 8 founders, 10 mentors, and state machine records.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
