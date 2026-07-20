import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Start seeding...');

  // 1. Seed Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Overall system administrator with full access' },
    { name: 'IT_ADMIN', description: 'IT Administrator managing assets, assignments, and returns' },
    { name: 'MANAGER', description: 'Department manager requesting/approving team assets' },
    {
      name: 'EMPLOYEE',
      description: 'Standard employee viewing assigned assets and making requests',
    },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log('Roles seeded.');

  // 2. Seed Departments
  const departments = [
    { name: 'IT Support', description: 'Information Technology Support' },
    { name: 'Engineering', description: 'Software and Hardware Engineering' },
    { name: 'Human Resources', description: 'People and Talent Operations' },
    { name: 'Finance', description: 'Financial planning and accounting' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log('Departments seeded.');

  // Get Super Admin Role and IT Support Department
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'SUPER_ADMIN' },
  });
  const employeeRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'EMPLOYEE' },
  });
  const itDept = await prisma.department.findUniqueOrThrow({
    where: { name: 'IT Support' },
  });

  // 3. Seed Users
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Super Admin User
  await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {},
    create: {
      email: 'admin@assetflow.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: superAdminRole.id,
      departmentId: itDept.id,
    },
  });

  // Employee User
  await prisma.user.upsert({
    where: { email: 'employee@assetflow.com' },
    update: {},
    create: {
      email: 'employee@assetflow.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Doe',
      roleId: employeeRole.id,
      departmentId: itDept.id,
    },
  });

  console.log('Users seeded successfully:');
  console.log('- admin@assetflow.com (Password123)');
  console.log('- employee@assetflow.com (Password123)');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
