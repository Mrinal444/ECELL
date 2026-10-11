const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.score.deleteMany();
  await prisma.review.deleteMany();
  await prisma.recusal.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.team.deleteMany();
  await prisma.contestJudge.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Creating users...');
  const organizer = await prisma.user.create({
    data: { name: 'Admin Organizer', email: 'admin@pitchvault.local', role: 'ORGANIZER', passwordHash }
  });

  const judgeA = await prisma.user.create({
    data: { name: 'Judge A (Smith)', email: 'judge.a@pitchvault.local', role: 'JUDGE', passwordHash }
  });

  const judgeB = await prisma.user.create({
    data: { name: 'Judge B (Jones)', email: 'judge.b@pitchvault.local', role: 'JUDGE', passwordHash }
  });

  const team1Owner = await prisma.user.create({
    data: { name: 'Alice Founder', email: 'alice@pitchvault.local', role: 'TEAM', passwordHash }
  });

  const team2Owner = await prisma.user.create({
    data: { name: 'Bob Co-founder', email: 'bob@pitchvault.local', role: 'TEAM', passwordHash }
  });

  console.log('Creating teams...');
  const team1 = await prisma.team.create({
    data: { name: 'Alpha Dynamics', ownerId: team1Owner.id }
  });
  const team2 = await prisma.team.create({
    data: { name: 'Beta Solutions', ownerId: team2Owner.id }
  });

  console.log('Creating contest Campus Pitch 2026...');
  // Contest in JUDGING state
  const contest = await prisma.contest.create({
    data: {
      title: 'Campus Pitch 2026',
      description: 'Annual cross-campus multi-disciplinary startup pitch competition.',
      status: 'JUDGING',
      blindReview: true,
      publicLeaderboard: false,
      submissionDeadline: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // yesterday
    }
  });

  console.log('Creating Criteria...');
  const critProblem = await prisma.criterion.create({ data: { contestId: contest.id, label: 'Problem', description: 'Severity and scale of the problem.', weight: 30, position: 0 } });
  const critSolution = await prisma.criterion.create({ data: { contestId: contest.id, label: 'Solution', description: 'Innovation and effectiveness.', weight: 30, position: 1 } });
  const critMarket = await prisma.criterion.create({ data: { contestId: contest.id, label: 'Market', description: 'TAM, SAM, SOM and go-to-market.', weight: 20, position: 2 } });
  const critTeam = await prisma.criterion.create({ data: { contestId: contest.id, label: 'Team', description: 'Execution capability.', weight: 20, position: 3 } });

  console.log('Assigning judges...');
  await prisma.contestJudge.create({ data: { contestId: contest.id, userId: judgeA.id, label: 'Judge A' } });
  await prisma.contestJudge.create({ data: { contestId: contest.id, userId: judgeB.id, label: 'Judge B' } });

  console.log('Creating submissions...');
  const sub1 = await prisma.submission.create({
    data: {
      contestId: contest.id,
      teamId: team1.id,
      title: 'AI Automated Parking',
      problem: 'Finding parking takes 20 mins on average.',
      solution: 'Computer vision guided autonomous valet.',
      market: '$5B parking optimization market in US.',
      traction: 'Pilot at University Hospital.',
      teamBios: 'Alice: MIT CS, 5 years at Waymo. Bob: Stanford MBA.',
      deckUrl: 'https://example.com/deck1.pdf',
    }
  });

  const sub2 = await prisma.submission.create({
    data: {
      contestId: contest.id,
      teamId: team2.id,
      title: 'Eco-Friendly Detergent Pods',
      problem: 'Microplastics from existing pods pollute water.',
      solution: '100% seaweed-based dissolving film.',
      market: '$10B consumer laundry market.',
      traction: '$10k monthly recurring revenue on Shopify.',
      teamBios: 'Bob: PhD in Materials Science.',
      deckUrl: 'https://example.com/deck2.pdf',
    }
  });

  console.log('Adding reviews...');
  // Sub 1: Fully reviewed by A and B
  const review1A = await prisma.review.create({
    data: {
      submissionId: sub1.id, judgeId: judgeA.id, overallComment: 'Solid technical background but market feels crowded.', submittedAt: new Date()
    }
  });
  await prisma.score.createMany({
    data: [
      { reviewId: review1A.id, criterionId: critProblem.id, value: 8 },
      { reviewId: review1A.id, criterionId: critSolution.id, value: 7 },
      { reviewId: review1A.id, criterionId: critMarket.id, value: 6 },
      { reviewId: review1A.id, criterionId: critTeam.id, value: 9 },
    ]
  });

  const review1B = await prisma.review.create({
    data: {
      submissionId: sub1.id, judgeId: judgeB.id, overallComment: 'Needs stronger go-to-market plan.', submittedAt: new Date()
    }
  });
  await prisma.score.createMany({
    data: [
      { reviewId: review1B.id, criterionId: critProblem.id, value: 9 },
      { reviewId: review1B.id, criterionId: critSolution.id, value: 6 },
      { reviewId: review1B.id, criterionId: critMarket.id, value: 5 },
      { reviewId: review1B.id, criterionId: critTeam.id, value: 8 },
    ]
  });

  // Sub 2: Reviewed only by A (Provisional)
  const review2A = await prisma.review.create({
    data: {
      submissionId: sub2.id, judgeId: judgeA.id, overallComment: 'Love the traction!', submittedAt: new Date()
    }
  });
  await prisma.score.createMany({
    data: [
      { reviewId: review2A.id, criterionId: critProblem.id, value: 9 },
      { reviewId: review2A.id, criterionId: critSolution.id, value: 9 },
      { reviewId: review2A.id, criterionId: critMarket.id, value: 8 },
      { reviewId: review2A.id, criterionId: critTeam.id, value: 7 },
    ]
  });

  // (Judge B hasn't submitted review for Sub 2 yet)

  console.log('Seed completed successfully!');
  console.log('--------------- DEMO ACCOUNTS (pw: password123) ---------------');
  console.log('Organizer: admin@pitchvault.local');
  console.log('Judge A:   judge.a@pitchvault.local');
  console.log('Judge B:   judge.b@pitchvault.local');
  console.log('Team 1:    alice@pitchvault.local');
  console.log('Team 2:    bob@pitchvault.local');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
