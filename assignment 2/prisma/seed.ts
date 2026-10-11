import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeCompanyName, normalizeDomain } from "../src/lib/normalization";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding E-Cell Outreach CRM Database...");

  // Clean existing tables
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.backupLog.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  // 1. Create Users
  const aditi = await prisma.user.create({
    data: {
      name: "Aditi Sharma",
      email: "aditi@ecell.org",
      passwordHash,
      role: "LEAD",
      active: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      name: "Aditi Sharma (Lead)",
      email: "aditi.lead@ecell.org",
      passwordHash,
      role: "LEAD",
      active: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      name: "Team Lead",
      email: "lead@ecell.org",
      passwordHash: adminHash,
      role: "LEAD",
      active: true,
      mustChangePassword: false,
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "rahul@ecell.org",
      passwordHash,
      role: "MEMBER",
      active: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      name: "Rohit Verma",
      email: "rohit@ecell.org",
      passwordHash,
      role: "MEMBER",
      active: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      name: "Rohit Verma",
      email: "rohit.member@ecell.org",
      passwordHash,
      role: "MEMBER",
      active: true,
      mustChangePassword: false,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: "Sneha Patel",
      email: "sneha@ecell.org",
      passwordHash,
      role: "MEMBER",
      active: true,
      mustChangePassword: true, // test forced password change
    },
  });

  console.log("✓ Created seed users (Leads & Members)");

  // 2. Create Campaigns
  const campaign2026 = await prisma.campaign.create({
    data: {
      name: "E-Summit 2026",
      year: 2026,
      goalINR: 2500000,
      active: true,
    },
  });

  const campaign2025 = await prisma.campaign.create({
    data: {
      name: "E-Summit 2025",
      year: 2025,
      goalINR: 1800000,
      active: false,
    },
  });

  console.log("✓ Created campaigns (E-Summit 2026 & E-Summit 2025)");

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const todayFollowUp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);

  // 3. Organization: TCS (Confirmed Title Sponsor)
  const tcs = await prisma.organization.create({
    data: {
      name: "Tata Consultancy Services Ltd",
      normalizedName: normalizeCompanyName("Tata Consultancy Services Ltd"),
      domain: normalizeDomain("tcs.com"),
      type: "SPONSOR",
      city: "Mumbai",
      notes: "Long-standing partner for campus summits. Primary contact prefers WhatsApp for initial outreach.",
      contacts: {
        create: [
          {
            name: "Rajiv Menon",
            title: "VP - University Relations",
            phone: "+91 98201 12345",
            email: "rajiv.menon@tcs.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const tcsDeal = await prisma.deal.create({
    data: {
      organizationId: tcs.id,
      campaignId: campaign2026.id,
      ownerId: aditi.id,
      stage: "CONFIRMED",
      tier: "TITLE",
      valueINR: 500000,
      dealType: "CASH",
      paymentStatus: "INVOICED",
      lastActivityAt: now,
      version: 1,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        dealId: tcsDeal.id,
        userId: aditi.id,
        type: "WHATSAPP",
        body: "Sent E-Summit 2026 brochure and proposal deck on WhatsApp.",
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        dealId: tcsDeal.id,
        userId: aditi.id,
        type: "MEETING",
        body: "Virtual sync with Rajiv Menon. Discussed Title Sponsorship deliverables, banner placement, and stage slot.",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        dealId: tcsDeal.id,
        userId: aditi.id,
        type: "STAGE_CHANGE",
        body: "Moved deal from Negotiation to Confirmed (Title Sponsor - ₹5,00,000). MoU signed.",
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Also create a 2025 past deal for TCS to show multi-campaign org view
  await prisma.deal.create({
    data: {
      organizationId: tcs.id,
      campaignId: campaign2025.id,
      ownerId: aditi.id,
      stage: "CONFIRMED",
      tier: "PLATINUM",
      valueINR: 400000,
      dealType: "CASH",
      paymentStatus: "RECEIVED",
      lastActivityAt: new Date(2025, 1, 15),
    },
  });

  // 4. Organization: Tata Technologies (Deliberate near-duplicate / fuzzy test)
  const tataTech = await prisma.organization.create({
    data: {
      name: "Tata Technologies Solutions",
      normalizedName: normalizeCompanyName("Tata Technologies Solutions"),
      domain: normalizeDomain("tatatechnologies.com"),
      type: "SPONSOR",
      city: "Pune",
      notes: "Engineering R&D arm. Exploring hackathon title sponsorship.",
      contacts: {
        create: [
          {
            name: "Vikram Saxena",
            title: "CSR & Campus Head",
            phone: "+91 98201 12345", // Deliberate phone collision with TCS contact to test phone warning
            email: "vikram.s@tatatechnologies.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: tataTech.id,
      campaignId: campaign2026.id,
      ownerId: rahul.id,
      stage: "PROSPECT",
      lastActivityAt: now,
      nextFollowUpAt: threeDaysFromNow,
    },
  });

  // 5. Organization: Red Bull India (In-Kind Negotiation)
  const redBull = await prisma.organization.create({
    data: {
      name: "Red Bull India Pvt Ltd",
      normalizedName: normalizeCompanyName("Red Bull India Pvt Ltd"),
      domain: normalizeDomain("redbull.com"),
      type: "PARTNER",
      city: "Mumbai",
      notes: "Providing 1,500 cans of energy drinks for hackathon participants + branded DJ booth.",
      contacts: {
        create: [
          {
            name: "Tanya Oberoi",
            title: "Student Culture Manager",
            phone: "+91 98112 34567",
            email: "tanya.oberoi@redbull.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const redBullDeal = await prisma.deal.create({
    data: {
      organizationId: redBull.id,
      campaignId: campaign2026.id,
      ownerId: sneha.id,
      stage: "NEGOTIATION",
      tier: "IN_KIND",
      valueINR: 250000,
      dealType: "IN_KIND",
      paymentStatus: "PLEDGED",
      nextFollowUpAt: threeDaysFromNow,
      lastActivityAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activity.create({
    data: {
      dealId: redBullDeal.id,
      userId: sneha.id,
      type: "CALL",
      body: "Discussed logistics for chillers, can delivery, and banner placement at the Main Auditorium foyer.",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 6. Organization: Zerodha (Overdue Follow-up test)
  const zerodha = await prisma.organization.create({
    data: {
      name: "Zerodha Broking Ltd",
      normalizedName: normalizeCompanyName("Zerodha Broking Ltd"),
      domain: normalizeDomain("zerodha.com"),
      type: "SPONSOR",
      city: "Bengaluru",
      notes: "Fintech literacy partner for trading simulation event.",
      contacts: {
        create: [
          {
            name: "Karthik Rangappa",
            title: "VP - Varsity Outreach",
            phone: "+91 98765 43210",
            email: "karthik.r@zerodha.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const zerodhaDeal = await prisma.deal.create({
    data: {
      organizationId: zerodha.id,
      campaignId: campaign2026.id,
      ownerId: rahul.id,
      stage: "MEETING_SCHEDULED",
      tier: "GOLD",
      valueINR: 300000,
      dealType: "CASH",
      nextFollowUpAt: twoDaysAgo, // OVERDUE FOLLOW-UP!
      lastActivityAt: twoDaysAgo,
    },
  });

  await prisma.activity.create({
    data: {
      dealId: zerodhaDeal.id,
      userId: rahul.id,
      type: "EMAIL",
      body: "Sent calendar invite for pitch call. Awaiting confirmation from their team.",
      createdAt: twoDaysAgo,
    },
  });

  // 7. Organization: Swiggy (Stale Deal test - 14 days no touch)
  const swiggy = await prisma.organization.create({
    data: {
      name: "Swiggy (Bundl Technologies)",
      normalizedName: normalizeCompanyName("Swiggy Bundl Technologies"),
      domain: normalizeDomain("swiggy.com"),
      type: "SPONSOR",
      city: "Bengaluru",
      notes: "Food coupon partnership and stall setup in the food court.",
      contacts: {
        create: [
          {
            name: "Priya Deshmukh",
            title: "Campus Partnerships Manager",
            phone: "+91 99887 76655",
            email: "priya.deshmukh@swiggy.in",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const swiggyDeal = await prisma.deal.create({
    data: {
      organizationId: swiggy.id,
      campaignId: campaign2026.id,
      ownerId: sneha.id,
      stage: "CONTACTED",
      lastActivityAt: fourteenDaysAgo, // STALE (14 days ago)
      nextFollowUpAt: null,
    },
  });

  await prisma.activity.create({
    data: {
      dealId: swiggyDeal.id,
      userId: sneha.id,
      type: "EMAIL",
      body: "Emailed sponsorship pitch deck to partnerships@swiggy.in",
      createdAt: fourteenDaysAgo,
    },
  });

  // 8. Organization: GeeksforGeeks (Unclaimed Prospect)
  const gfg = await prisma.organization.create({
    data: {
      name: "GeeksforGeeks",
      normalizedName: normalizeCompanyName("GeeksforGeeks"),
      domain: normalizeDomain("geeksforgeeks.org"),
      type: "SPONSOR",
      city: "Noida",
      notes: "Coding track partner for national level coding contest.",
      contacts: {
        create: [
          {
            name: "Sandeep Jain",
            title: "Founder & CEO Office",
            phone: "+91 91234 56789",
            email: "partner@geeksforgeeks.org",
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: gfg.id,
      campaignId: campaign2026.id,
      ownerId: null, // UNCLAIMED DEAL
      stage: "PROSPECT",
      lastActivityAt: now,
      nextFollowUpAt: null,
    },
  });

  // 9. Organization: Infosys (Lost Deal with Reason)
  const infosys = await prisma.organization.create({
    data: {
      name: "Infosys Technologies Ltd",
      normalizedName: normalizeCompanyName("Infosys Technologies Ltd"),
      domain: normalizeDomain("infosys.com"),
      type: "SPONSOR",
      city: "Bengaluru",
      notes: "Budget freeze for Q1 college festivals.",
      contacts: {
        create: [
          {
            name: "Meera Iyer",
            title: "Campus Connect Lead",
            phone: "+91 98450 11223",
            email: "meera_iyer@infosys.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const infosysDeal = await prisma.deal.create({
    data: {
      organizationId: infosys.id,
      campaignId: campaign2026.id,
      ownerId: aditi.id,
      stage: "LOST",
      lostReason: "BUDGET",
      lastActivityAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      nextFollowUpAt: null,
    },
  });

  await prisma.activity.create({
    data: {
      dealId: infosysDeal.id,
      userId: aditi.id,
      type: "NOTE",
      body: "Spoke with Meera. Campus sponsorship budget already committed to tech fairs for this financial year. Suggested reaching out again in October for 2027.",
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // 10. Organization: Paytm (Replied, Follow-up due Today)
  const paytm = await prisma.organization.create({
    data: {
      name: "Paytm (One97 Communications)",
      normalizedName: normalizeCompanyName("Paytm One97 Communications"),
      domain: normalizeDomain("paytm.com"),
      type: "SPONSOR",
      city: "Noida",
      notes: "Interested in soundbox demo stalls & fintech keynote.",
      contacts: {
        create: [
          {
            name: "Amit Bansal",
            title: "Regional Marketing Lead",
            phone: "+91 98100 99887",
            email: "amit.bansal@paytm.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const paytmDeal = await prisma.deal.create({
    data: {
      organizationId: paytm.id,
      campaignId: campaign2026.id,
      ownerId: rahul.id,
      stage: "REPLIED",
      tier: "SILVER",
      valueINR: 150000,
      nextFollowUpAt: todayFollowUp, // DUE TODAY
      lastActivityAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activity.create({
    data: {
      dealId: paytmDeal.id,
      userId: rahul.id,
      type: "WHATSAPP",
      body: "Amit replied asking for stall dimensions and estimated student footfall during the keynote hour.",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Organization: Unacademy (Platinum Sponsor in Meeting Scheduled)
  const unacademy = await prisma.organization.create({
    data: {
      name: "Unacademy",
      normalizedName: normalizeCompanyName("Unacademy"),
      domain: normalizeDomain("unacademy.com"),
      type: "SPONSOR",
      city: "Bengaluru",
      notes: "Interested in exclusive EdTech stage sponsor rights and speaker panel seat.",
      contacts: {
        create: [
          {
            name: "Gaurav Munjal",
            title: "Strategic Partnerships",
            phone: "+91 99001 22334",
            email: "gaurav@unacademy.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const unacademyDeal = await prisma.deal.create({
    data: {
      organizationId: unacademy.id,
      campaignId: campaign2026.id,
      ownerId: aditi.id,
      stage: "MEETING_SCHEDULED",
      tier: "PLATINUM",
      valueINR: 500000,
      dealType: "CASH",
      nextFollowUpAt: fiveDaysFromNow,
      lastActivityAt: now,
    },
  });

  await prisma.activity.create({
    data: {
      dealId: unacademyDeal.id,
      userId: aditi.id,
      type: "MEETING",
      body: "Pitch meeting booked for Friday 4 PM with their growth marketing director.",
      createdAt: now,
    },
  });

  // 12. Organization: Boat Lifestyle
  const boat = await prisma.organization.create({
    data: {
      name: "boAt Lifestyle (Imagine Marketing)",
      normalizedName: normalizeCompanyName("boAt Lifestyle Imagine Marketing"),
      domain: normalizeDomain("boat-lifestyle.com"),
      type: "SPONSOR",
      city: "Mumbai",
      notes: "Audio partner for battle of the bands and VIP gift hampers.",
      contacts: {
        create: [
          {
            name: "Aman Gupta Office",
            title: "Brand Alliances",
            phone: "+91 98711 22334",
            email: "partnerships@boat-lifestyle.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: boat.id,
      campaignId: campaign2026.id,
      ownerId: sneha.id,
      stage: "CONTACTED",
      tier: "BRONZE",
      valueINR: 75000,
      nextFollowUpAt: threeDaysFromNow,
      lastActivityAt: now,
    },
  });

  console.log("✅ Seed database populated with realistic Indian campus sponsors, contacts, deals, activities, overdue and stale records!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
