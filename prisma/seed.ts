import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/owly?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin (password: admin123)
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
    },
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "My Business",
      businessDesc: "We provide excellent products and services.",
      welcomeMessage: "Hello! Welcome to our support. How can I help you today?",
      tone: "friendly",
      language: "auto",
    },
  });

  // Create default channels
  for (const type of ["whatsapp", "email", "phone"]) {
    await prisma.channel.upsert({
      where: { type },
      update: {},
      create: { type, isActive: false, status: "disconnected" },
    });
  }

  // Create default business hours
  await prisma.businessHours.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // Create sample departments
  const techDept = await prisma.department.upsert({
    where: { id: "dept-tech" },
    update: {},
    create: {
      id: "dept-tech",
      name: "Technical Support",
      description: "Handles technical issues, bugs, and product troubleshooting",
      email: "tech@example.com",
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { id: "dept-sales" },
    update: {},
    create: {
      id: "dept-sales",
      name: "Sales",
      description: "Handles pricing, quotes, and purchase inquiries",
      email: "sales@example.com",
    },
  });

  const billingDept = await prisma.department.upsert({
    where: { id: "dept-billing" },
    update: {},
    create: {
      id: "dept-billing",
      name: "Billing",
      description: "Handles invoices, payments, and refunds",
      email: "billing@example.com",
    },
  });

  // Create sample team members
  const members = [
    { id: "member-1", name: "John Smith", email: "john@example.com", role: "Lead", expertise: "software, debugging, API issues", departmentId: techDept.id },
    { id: "member-2", name: "Sarah Johnson", email: "sarah@example.com", role: "Member", expertise: "networking, infrastructure, deployment", departmentId: techDept.id },
    { id: "member-3", name: "Mike Davis", email: "mike@example.com", role: "Lead", expertise: "pricing, enterprise deals, partnerships", departmentId: salesDept.id },
    { id: "member-4", name: "Emily Brown", email: "emily@example.com", role: "Lead", expertise: "invoices, refunds, payment processing", departmentId: billingDept.id },
  ];

  for (const m of members) {
    await prisma.teamMember.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }

  // Create sample knowledge base
  const categories = [
    { id: "cat-faq", name: "FAQ", description: "Frequently asked questions", icon: "help-circle", color: "#4A7C9B", sortOrder: 0 },
    { id: "cat-products", name: "Products", description: "Product information and features", icon: "package", color: "#22C55E", sortOrder: 1 },
    { id: "cat-policies", name: "Policies", description: "Return, refund, and shipping policies", icon: "shield", color: "#F59E0B", sortOrder: 2 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  const entries = [
    { id: "entry-1", categoryId: "cat-faq", title: "Business Hours", content: "We are open Monday to Friday, 9:00 AM to 6:00 PM. Our AI assistant is available 24/7 for basic inquiries.", priority: 10 },
    { id: "entry-2", categoryId: "cat-faq", title: "Contact Information", content: "You can reach us via email at support@example.com, phone at +1-555-0123, or WhatsApp. Our AI assistant is always here to help!", priority: 9 },
    { id: "entry-3", categoryId: "cat-products", title: "Product Overview", content: "We offer a range of products designed to help businesses streamline their operations. Contact our sales team for detailed pricing and custom solutions.", priority: 5 },
    { id: "entry-4", categoryId: "cat-policies", title: "Return Policy", content: "We offer a 30-day return policy for all unused products in their original packaging. To initiate a return, please contact our support team with your order number.", priority: 8 },
    { id: "entry-5", categoryId: "cat-policies", title: "Refund Policy", content: "Refunds are processed within 5-10 business days after we receive the returned item. The refund will be credited to the original payment method.", priority: 7 },
  ];

  for (const e of entries) {
    await prisma.knowledgeEntry.upsert({ where: { id: e.id }, update: {}, create: e });
  }

  // Create sample tags
  const tags = [
    { id: "tag-1", name: "Urgent", color: "#EF4444" },
    { id: "tag-2", name: "VIP", color: "#F59E0B" },
    { id: "tag-3", name: "Follow-up", color: "#3B82F6" },
    { id: "tag-4", name: "Resolved", color: "#22C55E" },
    { id: "tag-5", name: "Bug", color: "#8B5CF6" },
  ];

  for (const t of tags) {
    await prisma.tag.upsert({ where: { id: t.id }, update: {}, create: t });
  }

  // Create sample canned responses
  const cannedResponses = [
    { id: "cr-1", title: "Greeting", content: "Hello! Thank you for reaching out. How can I help you today?", category: "General", shortcut: "/greeting" },
    { id: "cr-2", title: "Closing", content: "Thank you for contacting us! Is there anything else I can help you with?", category: "General", shortcut: "/closing" },
    { id: "cr-3", title: "Refund Process", content: "I understand you'd like a refund. Let me look into this for you. Could you please provide your order number?", category: "Billing", shortcut: "/refund" },
    { id: "cr-4", title: "Escalation", content: "I'll connect you with a specialist who can better assist you with this matter. Please hold on.", category: "Support", shortcut: "/escalate" },
  ];

  for (const cr of cannedResponses) {
    await prisma.cannedResponse.upsert({ where: { id: cr.id }, update: {}, create: cr });
  }

  // Create sample SLA rules
  const slaRules = [
    { id: "sla-1", name: "Standard Response", description: "Default response time for all channels", firstResponseMins: 30, resolutionMins: 480 },
    { id: "sla-2", name: "Urgent Priority", description: "Fast response for urgent issues", priority: "urgent", firstResponseMins: 5, resolutionMins: 60 },
  ];

  for (const sla of slaRules) {
    await prisma.sLARule.upsert({ where: { id: sla.id }, update: {}, create: sla });
  }

  console.log("Seed data created successfully!");
  console.log("Default admin: username=admin, password=admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
