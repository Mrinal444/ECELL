import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, addDays, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding E-Cell database with production-grade demo data...');

  // Clean existing tables safely
  await prisma.actionItem.deleteMany({});
  await prisma.decision.deleteMany({});
  await prisma.meetingAttendee.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.apiToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.member.deleteMany({});

  const now = new Date();

  // 1. Create Core Team Members with Aliases
  const rahulMember = await prisma.member.create({
    data: {
      name: 'Rahul Sharma',
      role: 'President',
      email: 'president@ecell.org',
      aliases: JSON.stringify(['Rahul', 'Rahul S', 'RS', '@rahul', 'rahulsharma']),
    },
  });

  const priyaMember = await prisma.member.create({
    data: {
      name: 'Priya Nair',
      role: 'Head of Corporate Relations & Sponsorships',
      email: 'sponsorship@ecell.org',
      aliases: JSON.stringify(['Priya', 'Priya N', 'PN', '@priya', 'priyanair']),
    },
  });

  const snehaMember = await prisma.member.create({
    data: {
      name: 'Sneha Patil',
      role: 'Head of Tech & Product',
      email: 'tech@ecell.org',
      aliases: JSON.stringify(['Sneha', 'Sneha P', 'SP', '@sneha', 'snehapatil']),
    },
  });

  const amanMember = await prisma.member.create({
    data: {
      name: 'Aman Verma',
      role: 'Events & Logistics Lead',
      email: 'events@ecell.org',
      aliases: JSON.stringify(['Aman', 'Aman V', 'AV', '@aman', 'amanverma']),
    },
  });

  const vikramMember = await prisma.member.create({
    data: {
      name: 'Vikram Roy',
      role: 'Design & Media Lead',
      email: 'media@ecell.org',
      aliases: JSON.stringify(['Vikram', 'Vikram R', 'VR', '@vikram', 'vikramroy']),
    },
  });

  const ananyaMember = await prisma.member.create({
    data: {
      name: 'Ananya Gupta',
      role: 'Finance & Treasury Lead',
      email: 'finance@ecell.org',
      aliases: JSON.stringify(['Ananya', 'Ananya G', 'AG', '@ananya', 'ananyagupta']),
    },
  });

  console.log('✅ Created 6 E-Cell team members');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@ecell.org',
      displayName: 'Rahul Sharma',
      passwordHash,
      memberId: rahulMember.id,
    },
  });

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@ecell.org',
      displayName: 'Sneha Patil',
      passwordHash,
      memberId: snehaMember.id,
    },
  });

  console.log('✅ Created demo users: demo@ecell.org and tech@ecell.org (password: password123)');

  // 3. Create Pre-configured Extension API Token
  const extensionToken = await prisma.apiToken.create({
    data: {
      userId: demoUser.id,
      token: 'ecell_ext_token_demo_987654321',
      label: 'Demo Chrome Extension (Auto-Linked)',
      lastUsedAt: new Date(),
    },
  });

  console.log('✅ Created extension API token: ecell_ext_token_demo_987654321');

  // 4. Create Historical and Active Meetings
  // Meeting 1: E-Summit 2026 Core Kickoff & Sponsor Pitching
  const meeting1 = await prisma.meeting.create({
    data: {
      title: 'E-Summit 2026 Core Kickoff & Sponsor Pitching',
      startsAt: subDays(now, 4),
      agenda: 'Finalize dates, corporate sponsorship tiers, key speaker targets, and logistics permissions.',
      notes: `## Minutes of Meeting
- Met with the college administration regarding dates for E-Summit 2026.
- Priya presented the updated sponsorship deck targeting 30 tech companies and VC funds.
- Sneha reviewed server architecture needs for handling 5,000+ registrations.
- Aman confirmed booking dates for Main Auditorium and Seminar Hall 1 & 2.`,
      rawText: `E-Summit 2026 Core Kickoff
Attendees: Rahul, Priya, Sneha, Aman, Vikram
Date: 4 days ago

Notes:
Admin gave the green light for March 14-16.
Priya's team needs the revised brochure by end of this week.
Tech team needs to get staging server ready before launching registrations.`,
      source: 'manual',
      createdById: demoUser.id,
      attendees: {
        create: [
          { memberId: rahulMember.id },
          { memberId: priyaMember.id },
          { memberId: snehaMember.id },
          { memberId: amanMember.id },
          { memberId: vikramMember.id },
        ],
      },
      decisions: {
        create: [
          { text: 'Locked E-Summit dates for March 14-16, 2026 at the Main Auditorium.' },
          { text: 'Set corporate sponsorship target to Rs 25,00,000 across Title, Co-Powered, and Track slabs.' },
          { text: 'Approved 10% budget increase for speaker hospitality and flight arrangements.' },
        ],
      },
      actionItems: {
        create: [
          {
            title: 'Finalize corporate pitch deck and brochure PDF',
            assigneeId: priyaMember.id,
            dueDate: endOfDay(subDays(now, 2)), // Overdue!
            status: 'open',
            origin: 'manual',
          },
          {
            title: 'Review speaker outreach list and send initial VIP invites',
            assigneeId: rahulMember.id,
            dueDate: endOfDay(subDays(now, 1)), // Overdue for Demo User!
            status: 'open',
            origin: 'manual',
          },
          {
            title: 'Set up registration portal staging environment',
            assigneeId: snehaMember.id,
            dueDate: endOfDay(addDays(now, 1)), // Due tomorrow (Due soon)
            status: 'in_progress',
            origin: 'manual',
          },
          {
            title: 'Reserve college auditorium and seminar halls with administration',
            assigneeId: amanMember.id,
            dueDate: endOfDay(subDays(now, 3)),
            status: 'done',
            completedAt: subDays(now, 3),
            origin: 'manual',
          },
        ],
      },
    },
  });

  // Meeting 2: Hackathon Track Sponsors & Prize Pool Alignment (WhatsApp chat import)
  const meeting2 = await prisma.meeting.create({
    data: {
      title: 'Hackathon Track Sponsors & Prize Pool Alignment',
      startsAt: subDays(now, 2),
      agenda: 'WhatsApp coordination on hackathon tracks, problem statements, and prize allocation.',
      notes: `## Hackathon Track Discussion
Imported from E-Cell WhatsApp Core group.
Tracks agreed: Generative AI & Automation, Decentralized FinTech, CleanTech & Sustainability.
Prize pool confirmed at Rs 3,00,000 total.`,
      rawText: `[10/07/26, 4:15 PM] Rahul Sharma: Hey team, we need to finalize hackathon tracks today.
[10/07/26, 4:17 PM] Sneha Patil: I suggest we go with AI, FinTech, and CleanTech. Those attract the highest quality student devs.
[10/07/26, 4:18 PM] Priya Nair: Agreed! A major venture fund said they will sponsor the AI track with 1 Lakh if we lock it in.
[10/07/26, 4:20 PM] Rahul Sharma: Decided: locked AI, FinTech, and CleanTech as the 3 tracks. Total cash prize pool is Rs 3,00,000.
[10/07/26, 4:22 PM] Sneha Patil: I will draft the problem statements by Friday.
[10/07/26, 4:25 PM] Vikram Roy: I will prepare the hackathon social media teaser rollout by tomorrow.
[10/07/26, 4:28 PM] Aman Verma: Will submit stage sound and lighting vendor quotes today.`,
      source: 'whatsapp_paste',
      createdById: demoUser.id,
      attendees: {
        create: [
          { memberId: rahulMember.id },
          { memberId: snehaMember.id },
          { memberId: priyaMember.id },
          { memberId: vikramMember.id },
          { memberId: amanMember.id },
        ],
      },
      decisions: {
        create: [
          { text: 'Selected AI, FinTech, and CleanTech as the 3 official hackathon tracks.' },
          { text: 'Confirmed Rs 3,00,000 total cash prize pool across all tracks.' },
        ],
      },
      actionItems: {
        create: [
          {
            title: 'Draft hackathon problem statements with industry mentors',
            assigneeId: snehaMember.id,
            dueDate: endOfDay(addDays(now, 3)),
            status: 'open',
            origin: 'ai_suggested',
          },
          {
            title: 'Prepare hackathon social media teaser rollout',
            assigneeId: vikramMember.id,
            dueDate: endOfDay(addDays(now, 1)), // Due soon
            status: 'in_progress',
            origin: 'ai_suggested',
          },
          {
            title: 'Submit stage sound and lighting vendor quotes',
            assigneeId: amanMember.id,
            dueDate: endOfDay(now), // Due today
            status: 'open',
            origin: 'ai_suggested',
          },
        ],
      },
    },
  });

  // Meeting 3: Weekly Speaker Outreach & PR Sync
  const meeting3 = await prisma.meeting.create({
    data: {
      title: 'Weekly Speaker Outreach & PR Sync',
      startsAt: subDays(now, 1),
      agenda: 'Keynote confirmations, travel logistics, and media partner outreach.',
      notes: `## Speaker Updates
- 2 Tier-1 unicorn founders confirmed presence.
- Need to finalize travel arrangements and PR releases.`,
      rawText: `Weekly Sync
Attendees: Rahul, Priya, Ananya
Decided: Confirmed 2 keynote unicorn founders.
Action: Priya to draft travel itineraries by next Monday.
Action: Ananya to approve budget release for travel advances by tomorrow.
Action: Rahul to review official press release by today.`,
      source: 'meet',
      createdById: demoUser.id,
      attendees: {
        create: [
          { memberId: rahulMember.id },
          { memberId: priyaMember.id },
          { memberId: ananyaMember.id },
        ],
      },
      decisions: {
        create: [
          { text: 'Confirmed 2 Tier-1 unicorn founders as headline keynote speakers.' },
        ],
      },
      actionItems: {
        create: [
          {
            title: 'Draft travel itineraries for keynote speakers',
            assigneeId: priyaMember.id,
            dueDate: endOfDay(addDays(now, 5)),
            status: 'open',
            origin: 'manual',
          },
          {
            title: 'Approve budget release for speaker travel advances',
            assigneeId: ananyaMember.id,
            dueDate: endOfDay(addDays(now, 1)),
            status: 'open',
            origin: 'manual',
          },
          {
            title: 'Review official press release before media rollout',
            assigneeId: rahulMember.id,
            dueDate: endOfDay(now), // Due today for Rahul
            status: 'open',
            origin: 'manual',
          },
        ],
      },
    },
  });

  console.log('✅ Created 3 realistic E-Cell meetings with decisions & actions');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
