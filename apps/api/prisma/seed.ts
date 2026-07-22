/**
 * ShiftFlow — Seed met een demo-tenant en demo-accounts.
 * Draai met: npm run db:seed  (workspace @shiftflow/api)
 *
 * Alle demo-accounts hebben wachtwoord: Demo1234!
 */
import {
  PrismaClient,
  Role,
  ShiftStatus,
  LeaveType,
  LeaveStatus,
  EmploymentType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PASSWORD = 'Demo1234!';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Schone lei voor de demo-tenant.
  await prisma.company.deleteMany({ where: { slug: 'demo' } });

  const company = await prisma.company.create({
    data: {
      name: 'ShiftFlow Demo Horeca',
      slug: 'demo',
      country: 'BE',
      subscription: { create: { plan: 'PROFESSIONAL', status: 'ACTIVE', seats: 25 } },
      locations: {
        create: [
          { name: 'Vestiging Gent', address: 'Korenmarkt 1, 9000 Gent' },
          { name: 'Vestiging Antwerpen', address: 'Grote Markt 5, 2000 Antwerpen' },
        ],
      },
    },
    include: { locations: true },
  });

  const gent = company.locations[0];

  const [keuken, bar, bediening] = await Promise.all([
    prisma.department.create({
      data: { companyId: company.id, locationId: gent.id, name: 'Keuken', color: '#F97316' },
    }),
    prisma.department.create({
      data: { companyId: company.id, locationId: gent.id, name: 'Bar', color: '#38BDF8' },
    }),
    prisma.department.create({
      data: { companyId: company.id, locationId: gent.id, name: 'Bediening', color: '#A855F7' },
    }),
  ]);

  // Demo-accounts: één per rol.
  const roleAccounts: Array<{ role: Role; first: string; last: string; email: string }> = [
    { role: Role.SUPER_ADMIN, first: 'Sam', last: 'Superadmin', email: 'superadmin@demo.shiftflow.app' },
    { role: Role.OWNER, first: 'Olivia', last: 'Eigenaar', email: 'owner@demo.shiftflow.app' },
    { role: Role.MANAGER, first: 'Max', last: 'Manager', email: 'manager@demo.shiftflow.app' },
    { role: Role.TEAM_LEAD, first: 'Tom', last: 'Teamleider', email: 'teamlead@demo.shiftflow.app' },
    { role: Role.HR, first: 'Hanne', last: 'Personeel', email: 'hr@demo.shiftflow.app' },
    { role: Role.ACCOUNTING, first: 'Bram', last: 'Boekhouder', email: 'accounting@demo.shiftflow.app' },
  ];

  for (const acc of roleAccounts) {
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: acc.email,
        passwordHash,
        firstName: acc.first,
        lastName: acc.last,
        role: acc.role,
      },
    });
  }

  // Werknemers.
  const employeeData = [
    { first: 'Emma', last: 'De Vries', color: '#0EA5E9', cost: 18 },
    { first: 'Liam', last: 'Peeters', color: '#22C55E', cost: 17 },
    { first: 'Noa', last: 'Janssens', color: '#EAB308', cost: 19 },
    { first: 'Lucas', last: 'Maes', color: '#EF4444', cost: 16 },
    { first: 'Mila', last: 'Willems', color: '#EC4899', cost: 20 },
  ];
  const employees = [];
  for (const e of employeeData) {
    const emp = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${e.first.toLowerCase()}@demo.shiftflow.app`,
        passwordHash,
        firstName: e.first,
        lastName: e.last,
        role: Role.EMPLOYEE,
        color: e.color,
        hourlyCost: e.cost,
        employmentType: EmploymentType.PART_TIME,
        contractHoursPerWeek: 24,
        leaveBalances: {
          create: [
            { type: LeaveType.VACATION, year: 2026, totalHours: 160, usedHours: 24 },
            { type: LeaveType.ADV, year: 2026, totalHours: 40, usedHours: 8 },
          ],
        },
      },
    });
    employees.push(emp);
  }

  // Shifts voor de komende 7 dagen.
  const depts = [keuken, bar, bediening];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  let created = 0;
  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < depts.length; i++) {
      const start = new Date(base);
      start.setDate(base.getDate() + day);
      start.setHours(9 + i * 2, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 8);

      const assignee = day % 2 === 0 ? employees[(day + i) % employees.length] : null;
      await prisma.shift.create({
        data: {
          companyId: company.id,
          locationId: gent.id,
          departmentId: depts[i].id,
          assigneeId: assignee?.id ?? null,
          title: `${depts[i].name} shift`,
          startsAt: start,
          endsAt: end,
          breakMinutes: 30,
          status: assignee ? ShiftStatus.ASSIGNED : ShiftStatus.OPEN,
          color: depts[i].color,
          isPublished: true,
        },
      });
      created++;
    }
  }

  // Een verlofaanvraag.
  const soon = new Date(base);
  soon.setDate(base.getDate() + 10);
  const soonEnd = new Date(soon);
  soonEnd.setDate(soon.getDate() + 3);
  await prisma.leaveRequest.create({
    data: {
      companyId: company.id,
      employeeId: employees[0].id,
      type: LeaveType.VACATION,
      status: LeaveStatus.PENDING,
      startsAt: soon,
      endsAt: soonEnd,
      hours: 24,
      reason: 'Weekendje weg',
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `✅ Seed klaar: bedrijf "${company.name}", ${roleAccounts.length} rol-accounts, ` +
      `${employees.length} werknemers, ${created} shifts. Wachtwoord: ${PASSWORD}`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
