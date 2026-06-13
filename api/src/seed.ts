import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import bcrypt from 'bcrypt';
import prisma from './lib/prisma';

async function main() {
  // ── Boards ────────────────────────────────────────────────────────────────────
  const boardData = [
    { name: 'CBSE', description: 'Central Board of Secondary Education' },
    { name: 'ICSE', description: 'Indian Certificate of Secondary Education' },
    { name: 'State Board', description: 'State government curriculum boards' },
  ];

  for (const b of boardData) {
    await prisma.board.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log('Boards seeded: CBSE, ICSE, State Board');

  // ── Admin user ────────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: 'admin@learnflow.com' } });
  if (existing) {
    console.log('Admin user already exists:', existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'LearnFlow Admin',
      email: 'admin@learnflow.com',
      passwordHash,
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin.email, '| id:', admin.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
