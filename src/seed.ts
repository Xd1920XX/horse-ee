// Seed 3 sample competitions on first boot. Idempotent — bails if any exist.

import { createClass, createCompetition, createRegistration, listCompetitions } from './domain/competitions';
import { setDoc } from './firebase';
import type { Horse } from './domain/types';

const DAY = 86_400_000;

const SAMPLE_HORSES: Omit<Horse, 'id'>[] = [
  { ownerUid: 'demo-rider-1', name: 'Rakett', breed: 'Eesti sporthobune', birthYear: 2015 },
  { ownerUid: 'demo-rider-1', name: 'Taara', breed: 'Hannoveri', birthYear: 2017 },
  { ownerUid: 'demo-rider-2', name: 'Vulkaan', breed: 'Trakeeni', birthYear: 2014 },
  { ownerUid: 'demo-rider-2', name: 'Luna', breed: 'KWPN', birthYear: 2016 },
  { ownerUid: 'demo-rider-3', name: 'Mustang', breed: 'Eesti ratsahobune', birthYear: 2018 },
];

const RIDERS = [
  { uid: 'demo-rider-1', name: 'Anna Tamm' },
  { uid: 'demo-rider-2', name: 'Mart Kask' },
  { uid: 'demo-rider-3', name: 'Liisa Mägi' },
  { uid: 'demo-rider-4', name: 'Jaan Kuusk' },
  { uid: 'demo-rider-5', name: 'Kati Lepp' },
];

type ClassSpec = { name: string; heightCm: number; rules: 'A/A' | 'A/A_piiraja' | 'TableC'; timeLimit: number; fee: number };

const COMP_SPECS: {
  name: string;
  venue: string;
  daysAhead: number;
  description: string;
  status: 'open' | 'running' | 'draft';
  classes: ClassSpec[];
}[] = [
  {
    name: 'Ruila Kevadcup 2026',
    venue: 'Ruila Ratsakeskus',
    daysAhead: 14,
    description: 'Hooaja avavõistlus, kõik tasemed oodatud. Soojendusala avatud 1h enne starti.',
    status: 'open',
    classes: [
      { name: 'Maalatid', heightCm: 0, rules: 'A/A', timeLimit: 90, fee: 1500 },
      { name: 'Rist 40 cm', heightCm: 30, rules: 'A/A', timeLimit: 100, fee: 1500 },
      { name: '70 cm', heightCm: 70, rules: 'A/A', timeLimit: 110, fee: 2000 },
      { name: '90 cm', heightCm: 90, rules: 'A/A_piiraja', timeLimit: 120, fee: 2500 },
      { name: '110 cm', heightCm: 110, rules: 'A/A_piiraja', timeLimit: 130, fee: 3000 },
    ],
  },
  {
    name: 'Tallinn Indoor Challenge',
    venue: 'Tallinna Ratsabaas',
    daysAhead: 2,
    description: 'Sisevõistlus 20x60 platsil. TOP 3 saavad karikad.',
    status: 'running',
    classes: [
      { name: '80 cm', heightCm: 80, rules: 'A/A', timeLimit: 115, fee: 2000 },
      { name: '100 cm', heightCm: 100, rules: 'A/A_piiraja', timeLimit: 125, fee: 2500 },
      { name: '120 cm', heightCm: 120, rules: 'TableC', timeLimit: 140, fee: 3500 },
    ],
  },
  {
    name: 'Pärnu Suvemängud',
    venue: 'Pärnu Ratsaklubi',
    daysAhead: 45,
    description: 'Suveperioodi tipp-sündmus. Grand Prix 140 cm, lastevõistlus eraldi.',
    status: 'draft',
    classes: [
      { name: 'Rist 30 cm', heightCm: 30, rules: 'A/A', timeLimit: 100, fee: 1500 },
      { name: '60 cm', heightCm: 60, rules: 'A/A', timeLimit: 105, fee: 1800 },
      { name: '100 cm', heightCm: 100, rules: 'A/A_piiraja', timeLimit: 125, fee: 3000 },
      { name: '130 cm', heightCm: 130, rules: 'A/A_piiraja', timeLimit: 140, fee: 4000 },
      { name: 'Grand Prix 140 cm', heightCm: 140, rules: 'A/A_piiraja', timeLimit: 150, fee: 5000 },
    ],
  },
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await listCompetitions();
  if (existing.length > 0) return;

  // Users
  for (const r of RIDERS) {
    await setDoc(`users/${r.uid}`, {
      uid: r.uid,
      email: `${r.uid}@demo.ee`,
      displayName: r.name,
      provider: 'password',
      roles: { organizer: false, admin: false },
    });
  }
  await setDoc(`users/demo-organizer`, {
    uid: 'demo-organizer',
    email: 'korraldaja@demo.ee',
    displayName: 'Demo Korraldaja',
    provider: 'password',
    roles: { organizer: true, admin: false },
  });

  // Horses
  for (const h of SAMPLE_HORSES) {
    const id = `horse-${h.name.toLowerCase()}`;
    await setDoc(`horses/${id}`, { ...h, id });
  }

  const now = Date.now();

  for (const spec of COMP_SPECS) {
    const compId = await createCompetition({
      organizerUid: 'demo-organizer',
      name: spec.name,
      venue: spec.venue,
      date: now + spec.daysAhead * DAY,
      registrationDeadline: now + Math.max(1, spec.daysAhead - 3) * DAY,
      description: spec.description,
      status: spec.status,
      judgeUids: [],
    });

    for (let i = 0; i < spec.classes.length; i++) {
      const cl = spec.classes[i];
      const classId = await createClass(compId, {
        name: cl.name,
        heightCm: cl.heightCm,
        rules: cl.rules,
        timeLimitSeconds: cl.timeLimit,
        entryFeeCents: cl.fee,
        orderIndex: i,
      });

      // Seed 3-5 registrations per class (not for drafts)
      if (spec.status === 'draft') continue;
      const regCount = 3 + Math.floor(Math.random() * 3);
      for (let r = 0; r < regCount; r++) {
        const rider = RIDERS[(i + r) % RIDERS.length];
        const horse = SAMPLE_HORSES[(i + r) % SAMPLE_HORSES.length];
        await createRegistration(compId, {
          riderUid: rider.uid,
          riderDisplayName: rider.name,
          horseId: `horse-${horse.name.toLowerCase()}`,
          horseName: horse.name,
          classId,
          status: 'confirmed',
        });
      }
    }
  }
}
