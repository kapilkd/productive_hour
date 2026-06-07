import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import bcrypt from 'bcrypt';
import prisma from './lib/prisma';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@learnflow.com' } });
  if (existing) {
    console.log('Seed already run — admin user exists:', existing.email);
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
