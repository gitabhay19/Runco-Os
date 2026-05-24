import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const Role = { ADMIN: "ADMIN", USER: "USER" } as const;

// Use the direct (non-pooled) URL for seeding if available.
// Neon's pooler doesn't support the session-mode commands Prisma needs.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const STAGES = [
  {
    name: "Prospects",
    slug: "prospects",
    description: "Top-of-funnel companies worth a closer look.",
    color: "#94a3b8",
    order: 1,
  },
  {
    name: "Leads",
    slug: "leads",
    description: "Qualified contacts, conversation started.",
    color: "#0ea5e9",
    order: 2,
  },
  {
    name: "Proposal",
    slug: "proposal",
    description: "Proposal sent and under review.",
    color: "#6366f1",
    order: 3,
  },
  {
    name: "Negotiation",
    slug: "negotiation",
    description: "Terms, pricing and scope being finalised.",
    color: "#f59e0b",
    order: 4,
  },
  {
    name: "Closed Won",
    slug: "closed-won",
    description: "Deals signed and onboarded.",
    color: "#10b981",
    order: 5,
    isTerminal: true,
  },
  {
    name: "Closed Lost",
    slug: "closed-lost",
    description: "Lost or disqualified — keep for future reference.",
    color: "#ef4444",
    order: 6,
    isTerminal: true,
  },
];

const SAMPLE_DEALS: Array<{
  company: string;
  contact: string;
  designation: string;
  description: string;
  stage: string;
  value: number;
  followUpInDays: number;
  phones: string[];
  emails: string[];
  assignTo: "admin" | "sales";
}> = [
  {
    company: "Northwind Labs",
    contact: "Priya Shah",
    designation: "VP Marketing",
    description: "Inbound from LinkedIn campaign — interested in outbound buildout.",
    stage: "prospects",
    value: 24000,
    followUpInDays: 2,
    phones: ["+1 415 555 0142"],
    emails: ["priya@northwindlabs.com"],
    assignTo: "sales",
  },
  {
    company: "Helio Robotics",
    contact: "Marcus Lee",
    designation: "Head of Growth",
    description: "Referral from existing client. Mid-market B2B robotics.",
    stage: "prospects",
    value: 38000,
    followUpInDays: 5,
    phones: ["+1 408 555 0193", "+1 408 555 0194"],
    emails: ["marcus@heliorobotics.io", "growth@heliorobotics.io"],
    assignTo: "sales",
  },
  {
    company: "Lumen Studios",
    contact: "Aisha Khan",
    designation: "Founder",
    description: "Boutique creative agency. 8 person team, exploring outbound.",
    stage: "leads",
    value: 18500,
    followUpInDays: 1,
    phones: ["+44 20 7946 0123"],
    emails: ["aisha@lumenstudios.co"],
    assignTo: "sales",
  },
  {
    company: "Ridgeline Capital",
    contact: "John Carter",
    designation: "Managing Partner",
    description: "Wants demo for portfolio companies.",
    stage: "leads",
    value: 64000,
    followUpInDays: 3,
    phones: ["+1 212 555 0177"],
    emails: ["jcarter@ridgeline.vc"],
    assignTo: "admin",
  },
  {
    company: "Atlas Freight",
    contact: "Sara Mendes",
    designation: "Director, RevOps",
    description: "Logistics SaaS. Proposal sent on Aug 12.",
    stage: "proposal",
    value: 92000,
    followUpInDays: 4,
    phones: ["+1 312 555 0119"],
    emails: ["sara.m@atlasfreight.com"],
    assignTo: "sales",
  },
  {
    company: "BrightLoop",
    contact: "Daniel Yu",
    designation: "CEO",
    description: "Reviewing scope. Asked for case studies.",
    stage: "proposal",
    value: 41000,
    followUpInDays: 6,
    phones: ["+1 650 555 0121"],
    emails: ["dan@brightloop.app"],
    assignTo: "sales",
  },
  {
    company: "Vertex Health",
    contact: "Olivia Reyes",
    designation: "VP Sales",
    description: "Negotiating annual contract terms.",
    stage: "negotiation",
    value: 128000,
    followUpInDays: 1,
    phones: ["+1 503 555 0181"],
    emails: ["olivia@vertexhealth.com"],
    assignTo: "admin",
  },
  {
    company: "Quill & Quartz",
    contact: "Ethan Park",
    designation: "COO",
    description: "Closed — kicking off next week.",
    stage: "closed-won",
    value: 55000,
    followUpInDays: -7,
    phones: ["+1 646 555 0166"],
    emails: ["ethan@quillquartz.co"],
    assignTo: "sales",
  },
  {
    company: "Oakline Foods",
    contact: "Leo Bianchi",
    designation: "Marketing Lead",
    description: "Lost to in-house team. Revisit Q2 next year.",
    stage: "closed-lost",
    value: 22000,
    followUpInDays: -30,
    phones: ["+39 02 5550 0131"],
    emails: ["leo@oaklinefoods.it"],
    assignTo: "admin",
  },
];

async function main() {
  console.log("Seeding stages…");
  for (const s of STAGES) {
    await prisma.stage.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        color: s.color,
        order: s.order,
        isTerminal: s.isTerminal ?? false,
      },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        color: s.color,
        order: s.order,
        isTerminal: s.isTerminal ?? false,
      },
    });
  }

  console.log("Seeding admin user…");
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "abhaykalera1@gmail.com" },
    update: {},
    create: {
      email: "abhaykalera1@gmail.com",
      passwordHash: adminPassword,
      name: "Abhay Kalera",
      role: Role.ADMIN,
      designation: "Founder",
      department: "Operations",
      employeeId: "RC-0001",
      employmentType: "Full-time",
      joiningDate: new Date("2024-01-01"),
      avatarColor: "#0f172a",
    },
  });

  console.log("Seeding sample user…");
  const userPassword = await bcrypt.hash("User@123", 10);
  const sales = await prisma.user.upsert({
    where: { email: "sales@runcogrowth.com" },
    update: {},
    create: {
      email: "sales@runcogrowth.com",
      passwordHash: userPassword,
      name: "Alex Kim",
      role: Role.USER,
      designation: "Sales Manager",
      department: "Sales",
      employeeId: "RC-0002",
      employmentType: "Full-time",
      joiningDate: new Date("2024-06-15"),
      avatarColor: "#0ea5e9",
    },
  });

  // Skip seeding deals if some already exist (so re-running keeps user-created data).
  const existingDealCount = await prisma.deal.count();
  if (existingDealCount > 0) {
    console.log(`Deals already exist (${existingDealCount}). Skipping deal seed.`);
  } else {
    console.log("Seeding sample deals…");
    const stages = await prisma.stage.findMany();
    const stageBySlug = new Map(stages.map((s) => [s.slug, s]));

    // group sample deals by stage to assign positions
    const grouped = new Map<string, typeof SAMPLE_DEALS>();
    for (const d of SAMPLE_DEALS) {
      if (!grouped.has(d.stage)) grouped.set(d.stage, []);
      grouped.get(d.stage)!.push(d);
    }

    for (const [slug, deals] of grouped) {
      const stage = stageBySlug.get(slug);
      if (!stage) continue;
      let pos = 0;
      for (const d of deals) {
        const owner = d.assignTo === "admin" ? admin : sales;
        const followUp = new Date();
        followUp.setDate(followUp.getDate() + d.followUpInDays);

        await prisma.deal.create({
          data: {
            companyName: d.company,
            contactName: d.contact,
            designation: d.designation,
            description: d.description,
            followUpDate: followUp,
            value: d.value,
            stageId: stage.id,
            position: pos++,
            createdById: admin.id,
            phones: { create: d.phones.map((number) => ({ number })) },
            emails: { create: d.emails.map((address) => ({ address })) },
            assignees: { create: [{ userId: owner.id }] },
            stageNotes: { create: { stageId: stage.id } },
          },
        });
      }
    }
  }

  // Seed sample tasks (skip if any exist)
  const existingTaskCount = await prisma.task.count();
  if (existingTaskCount === 0) {
    console.log("Seeding sample tasks…");
    const today = new Date();
    const inDays = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };

    await prisma.task.createMany({
      data: [
        {
          title: "Follow up with Northwind Labs",
          description: "Send the customised proposal deck and confirm Friday call.",
          dueDate: inDays(1),
          priority: "HIGH",
          status: "TODO",
          assigneeId: sales.id,
          createdById: admin.id,
        },
        {
          title: "Send case studies to BrightLoop",
          description: "Daniel asked for 2-3 SaaS case studies before approval.",
          dueDate: inDays(3),
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          assigneeId: sales.id,
          createdById: admin.id,
        },
        {
          title: "Prepare Q3 pipeline review",
          description: "Compile stage distribution and conversion stats for the leadership sync.",
          dueDate: inDays(7),
          priority: "MEDIUM",
          status: "TODO",
          assigneeId: admin.id,
          createdById: admin.id,
        },
        {
          title: "Negotiate annual terms with Vertex Health",
          description: "Pricing approved by ops. Awaiting legal redlines.",
          dueDate: inDays(2),
          priority: "URGENT",
          status: "BLOCKED",
          assigneeId: admin.id,
          createdById: admin.id,
        },
        {
          title: "Onboard Quill & Quartz",
          description: "Kickoff call done. Need to share the onboarding tracker.",
          dueDate: inDays(-2),
          priority: "HIGH",
          status: "DONE",
          assigneeId: sales.id,
          createdById: admin.id,
        },
      ],
    });
  } else {
    console.log(`Tasks already exist (${existingTaskCount}). Skipping task seed.`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
