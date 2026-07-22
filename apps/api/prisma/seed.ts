/**
 * ShiftFlow — Uitgebreide seed met realistische demo-data voor ALLE modules.
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
  TimeEntryStatus,
  ClockMethod,
  NotificationChannel,
  DocumentType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const prisma = new PrismaClient();
const PASSWORD = 'Demo1234!';
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

// ── Datumhulpjes ──
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function at(day: Date, hour: number): Date {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}
/** Nacht (22-06), weekend (za/zo) en overuren (>8u) per minuut. */
function computeWorked(clockIn: Date, clockOut: Date, breakMinutes: number) {
  const gross = Math.max(0, Math.round((clockOut.getTime() - clockIn.getTime()) / 60000));
  const workedMinutes = Math.max(0, gross - breakMinutes);
  let nightMinutes = 0;
  let weekendMinutes = 0;
  for (let t = clockIn.getTime(); t < clockOut.getTime(); t += 60000) {
    const d = new Date(t);
    const h = d.getHours();
    const dow = d.getDay();
    if (h >= 22 || h < 6) nightMinutes++;
    if (dow === 0 || dow === 6) weekendMinutes++;
  }
  return {
    workedMinutes,
    nightMinutes: Math.min(nightMinutes, workedMinutes),
    weekendMinutes: Math.min(weekendMinutes, workedMinutes),
    overtimeMinutes: Math.max(0, workedMinutes - 480),
  };
}

export async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const thisMonday = startOfWeek(new Date());

  // Schone lei voor de demo-tenant.
  await prisma.company.deleteMany({ where: { slug: 'demo' } });

  const company = await prisma.company.create({
    data: {
      name: 'ShiftFlow Demo Horeca',
      slug: 'demo',
      country: 'BE',
      vatNumber: 'BE0123456789',
      address: 'Korenmarkt 1, 9000 Gent',
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
    prisma.department.create({ data: { companyId: company.id, locationId: gent.id, name: 'Keuken', color: '#F97316' } }),
    prisma.department.create({ data: { companyId: company.id, locationId: gent.id, name: 'Bar', color: '#38BDF8' } }),
    prisma.department.create({ data: { companyId: company.id, locationId: gent.id, name: 'Bediening', color: '#A855F7' } }),
  ]);
  const depts = [keuken, bar, bediening];

  // ── Kwalificaties ──
  const [barista, ehbo, wijn] = await Promise.all([
    prisma.qualification.create({ data: { name: 'Barista' } }),
    prisma.qualification.create({ data: { name: 'EHBO' } }),
    prisma.qualification.create({ data: { name: 'Wijnkennis' } }),
  ]);

  // ── Rol-accounts ──
  const roleAccounts = [
    { role: Role.SUPER_ADMIN, first: 'Sam', last: 'Superadmin', email: 'superadmin@demo.shiftflow.app' },
    { role: Role.OWNER, first: 'Olivia', last: 'Eigenaar', email: 'owner@demo.shiftflow.app' },
    { role: Role.MANAGER, first: 'Max', last: 'Manager', email: 'manager@demo.shiftflow.app' },
    { role: Role.TEAM_LEAD, first: 'Tom', last: 'Teamleider', email: 'teamlead@demo.shiftflow.app' },
    { role: Role.HR, first: 'Hanne', last: 'Personeel', email: 'hr@demo.shiftflow.app' },
    { role: Role.ACCOUNTING, first: 'Bram', last: 'Boekhouder', email: 'accounting@demo.shiftflow.app' },
  ];
  const roleUsers: Record<string, string> = {};
  for (const acc of roleAccounts) {
    const u = await prisma.user.create({
      data: { companyId: company.id, email: acc.email, passwordHash, firstName: acc.first, lastName: acc.last, role: acc.role },
    });
    roleUsers[acc.role] = u.id;
  }
  const managerId = roleUsers[Role.MANAGER];

  // ── Werknemers ──
  const employeeData = [
    { first: 'Emma', last: 'De Vries', color: '#0EA5E9', cost: 18, hours: 24, quals: [barista.id, ehbo.id] },
    { first: 'Liam', last: 'Peeters', color: '#22C55E', cost: 17, hours: 32, quals: [wijn.id] },
    { first: 'Noa', last: 'Janssens', color: '#EAB308', cost: 19, hours: 20, quals: [barista.id] },
    { first: 'Lucas', last: 'Maes', color: '#EF4444', cost: 16, hours: 38, quals: [] },
    { first: 'Mila', last: 'Willems', color: '#EC4899', cost: 20, hours: 24, quals: [ehbo.id, wijn.id] },
    { first: 'Sofie', last: 'Vermeulen', color: '#8B5CF6', cost: 21, hours: 30, quals: [barista.id] },
    { first: 'Yassine', last: 'El Amrani', color: '#14B8A6', cost: 18, hours: 32, quals: [wijn.id] },
  ];
  const employees: { id: string; first: string; color: string; cost: number }[] = [];
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
        contractHoursPerWeek: e.hours,
        hireDate: addDays(thisMonday, -200),
        qualifications: { create: e.quals.map((qid) => ({ qualificationId: qid })) },
        leaveBalances: {
          create: [
            { type: LeaveType.VACATION, year: thisMonday.getFullYear(), totalHours: 160, usedHours: 24 },
            { type: LeaveType.ADV, year: thisMonday.getFullYear(), totalHours: 40, usedHours: 8 },
            { type: LeaveType.RECUPERATION, year: thisMonday.getFullYear(), totalHours: 16, usedHours: 0 },
          ],
        },
        // Beschikbaarheid: iedereen doordeweeks 09-22, sommigen niet in het weekend.
        availabilities: {
          create: [
            { weekday: 1, startTime: '09:00', endTime: '22:00', isAvailable: true },
            { weekday: 2, startTime: '09:00', endTime: '22:00', isAvailable: true },
            { weekday: 3, startTime: '09:00', endTime: '22:00', isAvailable: true },
            { weekday: 4, startTime: '09:00', endTime: '22:00', isAvailable: true },
            { weekday: 5, startTime: '09:00', endTime: '23:00', isAvailable: true },
          ],
        },
      },
    });
    employees.push({ id: emp.id, first: e.first, color: e.color, cost: e.cost });
  }
  // Twee medewerkers niet beschikbaar in het weekend.
  await prisma.availability.createMany({
    data: [
      { userId: employees[0].id, weekday: 6, startTime: '00:00', endTime: '23:59', isAvailable: false },
      { userId: employees[0].id, weekday: 0, startTime: '00:00', endTime: '23:59', isAvailable: false },
      { userId: employees[2].id, weekday: 0, startTime: '00:00', endTime: '23:59', isAvailable: false },
    ],
  });

  // ── Shifts over 3 weken (vorige, deze, volgende) ──
  const slots = [
    { dept: keuken, from: 9, to: 17 },
    { dept: bar, from: 12, to: 20 },
    { dept: bediening, from: 17, to: 23 },
  ];

  const shiftQueue: Array<{
    companyId: string; locationId: string; departmentId: string;
    assigneeId: string | null; title: string; startsAt: Date; endsAt: Date;
    breakMinutes: number; status: ShiftStatus; color: string; isPublished: boolean;
  }> = [];

  let shiftCount = 0;
  let timeEntryCount = 0;
  for (const weekOffset of [-7, 0, 7]) {
    const weekStart = addDays(thisMonday, weekOffset);
    for (let day = 0; day < 6; day++) {
      const date = addDays(weekStart, day);
      slots.forEach((slot, i) => {
        // ~1 op 5 shifts blijft open.
        const open = (day + i) % 5 === 0;
        const emp = employees[(day + i + Math.abs(weekOffset)) % employees.length];
        const isPast = weekOffset < 0;
        const status = open
          ? ShiftStatus.OPEN
          : isPast
            ? ShiftStatus.COMPLETED
            : ShiftStatus.ASSIGNED;
        shiftQueue.push({
          companyId: company.id,
          locationId: gent.id,
          departmentId: slot.dept.id,
          assigneeId: open ? null : emp.id,
          title: `${slot.dept.name} shift`,
          startsAt: at(date, slot.from),
          endsAt: at(date, slot.to),
          breakMinutes: 30,
          status,
          color: slot.dept.color,
          isPublished: weekOffset <= 0,
        });
        shiftCount++;
      });
    }
  }

  // Shifts aanmaken en voor voorbije, toegewezen shifts een urenregistratie.
  for (const data of shiftQueue) {
    const shift = await prisma.shift.create({ data });
    if (data.status === ShiftStatus.COMPLETED && data.assigneeId) {
      const bd = computeWorked(shift.startsAt, shift.endsAt, shift.breakMinutes);
      await prisma.timeEntry.create({
        data: {
          userId: data.assigneeId,
          shiftId: shift.id,
          clockIn: shift.startsAt,
          clockOut: shift.endsAt,
          breakMinutes: shift.breakMinutes,
          method: ClockMethod.WEB,
          status: TimeEntryStatus.APPROVED,
          ...bd,
        },
      });
      timeEntryCount++;
    }
  }

  // ── Verlofaanvragen (verschillende statussen) ──
  const soon = addDays(thisMonday, 10);
  await prisma.leaveRequest.createMany({
    data: [
      { companyId: company.id, employeeId: employees[0].id, type: LeaveType.VACATION, status: LeaveStatus.PENDING, startsAt: soon, endsAt: addDays(soon, 4), hours: 32, reason: 'Weekje weg' },
      { companyId: company.id, employeeId: employees[1].id, type: LeaveType.ADV, status: LeaveStatus.APPROVED, startsAt: addDays(thisMonday, 3), endsAt: addDays(thisMonday, 3), hours: 8, reason: 'ADV-dag', decidedById: managerId, decidedAt: new Date() },
      { companyId: company.id, employeeId: employees[3].id, type: LeaveType.SICK, status: LeaveStatus.APPROVED, startsAt: addDays(thisMonday, -4), endsAt: addDays(thisMonday, -2), hours: 24, reason: 'Ziek', decidedById: managerId, decidedAt: new Date() },
      { companyId: company.id, employeeId: employees[4].id, type: LeaveType.VACATION, status: LeaveStatus.REJECTED, startsAt: addDays(thisMonday, 14), endsAt: addDays(thisMonday, 18), hours: 32, reason: 'Te druk die week', decidedById: managerId, decidedAt: new Date() },
      { companyId: company.id, employeeId: employees[5].id, type: LeaveType.PARENTAL, status: LeaveStatus.PENDING, startsAt: addDays(thisMonday, 20), endsAt: addDays(thisMonday, 24), hours: 40, reason: 'Ouderschapsverlof' },
    ],
  });

  // ── Aankondigingen ──
  await prisma.announcement.createMany({
    data: [
      { companyId: company.id, title: 'Nieuwe zomerkaart', body: 'Vanaf volgende week starten we met de zomerkaart. Briefing vrijdag 15u.' },
      { companyId: company.id, title: 'Teamevent', body: 'Op het einde van de maand is er een teamavond. Hou je agenda vrij!' },
    ],
  });

  // ── Notificaties per werknemer (mix gelezen/ongelezen) ──
  for (const emp of employees) {
    await prisma.notification.createMany({
      data: [
        { userId: emp.id, channel: NotificationChannel.IN_APP, title: 'Nieuwe shift ingepland', body: 'Je bent ingepland voor volgende week. Bekijk je planning.', linkUrl: '/planner' },
        { userId: emp.id, channel: NotificationChannel.IN_APP, title: '📢 Nieuwe zomerkaart', body: 'Briefing vrijdag 15u.', readAt: new Date() },
      ],
    });
  }

  // ── Documenten (met echte placeholder-bestanden zodat downloaden werkt) ──
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  function makeDoc(name: string, content: string): string {
    const key = `seed-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    writeFileSync(join(UPLOAD_DIR, key), content, 'utf8');
    return key;
  }
  const handbookKey = makeDoc('personeelshandboek', 'ShiftFlow demo — personeelshandboek.');
  await prisma.document.create({
    data: { companyId: company.id, userId: null, type: DocumentType.OTHER, name: 'Personeelshandboek', storageKey: handbookKey, mimeType: 'text/plain', sizeBytes: 40 },
  });
  for (let i = 0; i < 3; i++) {
    const emp = employees[i];
    const key = makeDoc(`contract-${emp.first}`, `Arbeidscontract voor ${emp.first} (demo).`);
    await prisma.document.create({
      data: {
        companyId: company.id,
        userId: emp.id,
        type: DocumentType.CONTRACT,
        name: `Arbeidscontract ${emp.first}`,
        storageKey: key,
        mimeType: 'text/plain',
        sizeBytes: 45,
        expiresAt: i === 0 ? addDays(new Date(), 20) : null, // 1 verloopt bijna
      },
    });
  }
  // Certificaat dat binnenkort verloopt.
  const certKey = makeDoc('ehbo-certificaat', 'EHBO-certificaat (demo).');
  await prisma.document.create({
    data: { companyId: company.id, userId: employees[4].id, type: DocumentType.CERTIFICATE, name: 'EHBO-certificaat', storageKey: certKey, mimeType: 'text/plain', sizeBytes: 30, expiresAt: addDays(new Date(), 12) },
  });

  // ── Chat: 1-op-1 en groepsgesprek ──
  const direct = await prisma.conversation.create({
    data: {
      companyId: company.id,
      isGroup: false,
      participants: { create: [{ userId: managerId }, { userId: employees[0].id }] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: direct.id, senderId: managerId, body: 'Hoi Emma, kan je zaterdag invallen?' },
      { conversationId: direct.id, senderId: employees[0].id, body: 'Deze zaterdag lukt niet, volgende wel!' },
      { conversationId: direct.id, senderId: managerId, body: 'Top, ik plan je volgende week in. 🙌' },
    ],
  });
  const group = await prisma.conversation.create({
    data: {
      companyId: company.id,
      name: 'Team Gent',
      isGroup: true,
      participants: { create: [managerId, ...employees.slice(0, 4).map((e) => e.id)].map((id) => ({ userId: id })) },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: group.id, senderId: managerId, body: 'Welkom in de teamchat van Gent! 👋' },
      { conversationId: group.id, senderId: employees[1].id, body: 'Dankje! Handig dit.' },
    ],
  });

  // eslint-disable-next-line no-console
  console.log(
    `✅ Seed klaar: "${company.name}"\n` +
      `   ${roleAccounts.length} rol-accounts, ${employees.length} werknemers\n` +
      `   ${shiftCount} shifts (3 weken), ${timeEntryCount} urenregistraties\n` +
      `   5 verlofaanvragen, 2 aankondigingen, meldingen, 5 documenten, 2 chats\n` +
      `   Wachtwoord voor alle accounts: ${PASSWORD}`,
  );
}

// Auto-uitvoeren wanneer direct aangeroepen (npm run db:seed).
if (require.main === module) {
  seed()
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
