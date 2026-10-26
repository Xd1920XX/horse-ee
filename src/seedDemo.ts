// Rich demo seed — 10 competitions with history, 5-30 riders per class, random
// finished results. Writes to real Firestore (or mock). Idempotent-ish:
// prefixes everything with `[DEMO]` so it's visually clear which rows are seed.

import { createCompetition, createRegistration } from './domain/competitions';
import { createClass } from './domain/classes';
import { createStart, updateStart } from './domain/starts';
import { setDoc } from './firebase';
import type { Horse } from './domain/types';

const DAY = 86_400_000;

const RIDERS = [
  { uid: 'demo-anna-tamm', name: 'Anna Tamm' },
  { uid: 'demo-mart-kask', name: 'Mart Kask' },
  { uid: 'demo-liisa-magi', name: 'Liisa Mägi' },
  { uid: 'demo-jaan-kuusk', name: 'Jaan Kuusk' },
  { uid: 'demo-kati-lepp', name: 'Kati Lepp' },
  { uid: 'demo-kaarel-saar', name: 'Kaarel Saar' },
  { uid: 'demo-triin-vald', name: 'Triin Vald' },
  { uid: 'demo-madis-oun', name: 'Madis Õun' },
  { uid: 'demo-eva-murakas', name: 'Eva Murakas' },
  { uid: 'demo-rein-paju', name: 'Rein Paju' },
  { uid: 'demo-helen-kuusik', name: 'Helen Kuusik' },
  { uid: 'demo-tanel-sepp', name: 'Tanel Sepp' },
  { uid: 'demo-sandra-piiber', name: 'Sandra Piiber' },
  { uid: 'demo-marko-lind', name: 'Marko Lind' },
  { uid: 'demo-piret-ojala', name: 'Piret Ojala' },
  { uid: 'demo-ott-sarapuu', name: 'Ott Sarapuu' },
  { uid: 'demo-maria-rohi', name: 'Maria Rohi' },
  { uid: 'demo-rasmus-jarv', name: 'Rasmus Järv' },
  { uid: 'demo-liina-noor', name: 'Liina Noor' },
  { uid: 'demo-silver-aas', name: 'Silver Aas' },
  { uid: 'demo-krista-mets', name: 'Krista Mets' },
  { uid: 'demo-indrek-tall', name: 'Indrek Tall' },
  { uid: 'demo-mari-koit', name: 'Mari Koit' },
  { uid: 'demo-andres-leis', name: 'Andres Leis' },
  { uid: 'demo-reet-tulp', name: 'Reet Tulp' },
  { uid: 'demo-vahur-paas', name: 'Vahur Paas' },
  { uid: 'demo-kadri-vill', name: 'Kadri Vill' },
  { uid: 'demo-janek-lember', name: 'Janek Lember' },
  { uid: 'demo-eve-haljand', name: 'Eve Haljand' },
  { uid: 'demo-tiit-rebane', name: 'Tiit Rebane' },
];

const HORSE_NAMES = [
  'Rakett', 'Taara', 'Vulkaan', 'Luna', 'Mustang',
  'Ürgvool', 'Tähemees', 'Vikerkaar', 'Pilveratsu', 'Tuulike',
  'Kuldratsu', 'Mäekotkas', 'Sireli', 'Virmaline', 'Põnni',
  'Sõber', 'Kangelane', 'Vikerpuu', 'Metsavaht', 'Hõbe',
  'Mustakas', 'Valgetäht', 'Taevaratsu', 'Põderpoiss', 'Kalevipoeg',
  'Tähekilp', 'Rünnak', 'Sillerdaja', 'Mäerebane', 'Põhjatuul',
];

const BREEDS = ['Eesti sporthobune', 'Hannoveri', 'Trakeeni', 'KWPN', 'Westfalen', 'Holsteini', 'Ponitõug'];

const VENUES = [
  'Ruila Ratsakeskus', 'Tallinna Ratsabaas', 'Pärnu Ratsaklubi', 'Tartu Ratsakool',
  'Niitvälja Golf & Ratsutamise Keskus', 'Rakvere Ratsaklubi', 'Viljandi Ratsakool',
  'Kuressaare Ratsaklubi', 'Haapsalu Ratsutamise Klubi', 'Narva Ratsaselts',
];

const COMP_NAMES = [
  'Kevadcup', 'Suvemängud', 'Sügisekarikas', 'Talvemeistrivõistlused',
  'Riigikarikas', 'Noorteklubi karikas', 'Lahtised meistrivõistlused',
  'MTM Grand Prix', 'Rahvusvaheline karikas', 'Ratsutamise maraton',
];

const CLASS_PRESETS: { name: string; heightCm: number; rules: 'A/A' | 'A/A_piiraja' | 'TableC'; timeLimit: number; fee: number }[] = [
  { name: 'Maalatt', heightCm: 0, rules: 'A/A', timeLimit: 90, fee: 1500 },
  { name: 'Rist 40 cm', heightCm: 30, rules: 'A/A', timeLimit: 100, fee: 1500 },
  { name: '60 cm', heightCm: 60, rules: 'A/A', timeLimit: 105, fee: 1800 },
  { name: '80 cm', heightCm: 80, rules: 'A/A', timeLimit: 115, fee: 2000 },
  { name: '100 cm', heightCm: 100, rules: 'A/A_piiraja', timeLimit: 125, fee: 2500 },
  { name: '110 cm', heightCm: 110, rules: 'A/A_piiraja', timeLimit: 130, fee: 3000 },
  { name: '120 cm', heightCm: 120, rules: 'TableC', timeLimit: 140, fee: 3500 },
  { name: '130 cm', heightCm: 130, rules: 'A/A_piiraja', timeLimit: 140, fee: 4000 },
  { name: 'Grand Prix 140', heightCm: 140, rules: 'A/A_piiraja', timeLimit: 150, fee: 5000 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomResult(timeLimit: number): { faults: number; timeSeconds: number } {
  // Realistic distribution:
  // 25% clean (0 fp), 25% one knock (4 fp), 15% two knocks (8), 10% three knocks (12),
  // 10% refusal + knock (8), 10% messy (16+), 5% elim handled separately
  const roll = Math.random();
  let jumpFaults: number;
  if (roll < 0.25) jumpFaults = 0;
  else if (roll < 0.5) jumpFaults = 4;
  else if (roll < 0.65) jumpFaults = 8;
  else if (roll < 0.75) jumpFaults = 12;
  else if (roll < 0.85) jumpFaults = 8;
  else jumpFaults = 16;
  // time: around timeLimit with normal distribution
  const base = timeLimit * (0.75 + Math.random() * 0.35);
  const timeSeconds = +base.toFixed(2);
  return { faults: jumpFaults, timeSeconds };
}

export async function seedDemoCompetitions(organizerUid: string, organizerDisplayName: string): Promise<{ competitions: number; registrations: number; starts: number }> {
  let regCount = 0;
  let startCount = 0;

  // Create demo users + horses in Firestore (so they look real on protocols)
  for (const r of RIDERS) {
    await setDoc(`users/${r.uid}`, {
      uid: r.uid,
      email: `${r.uid}@demo.ee`,
      displayName: r.name,
      provider: 'password',
      roles: { organizer: false, admin: false },
      createdAt: Date.now(),
    });
  }
  const horsesByOwner: Record<string, { id: string; name: string }[]> = {};
  for (let i = 0; i < HORSE_NAMES.length; i++) {
    const horse = {
      id: `demo-horse-${i}-${HORSE_NAMES[i].toLowerCase()}`,
      ownerUid: RIDERS[i % RIDERS.length].uid,
      name: HORSE_NAMES[i],
      breed: pick(BREEDS),
      birthYear: 2010 + Math.floor(Math.random() * 13),
    } as Horse;
    await setDoc(`horses/${horse.id}`, horse);
    if (!horsesByOwner[horse.ownerUid]) horsesByOwner[horse.ownerUid] = [];
    horsesByOwner[horse.ownerUid].push({ id: horse.id, name: horse.name });
  }
  // Ensure all riders have at least one horse
  const defaultHorse = { id: 'demo-horse-shared', name: 'Pegasus' };
  await setDoc(`horses/${defaultHorse.id}`, {
    id: defaultHorse.id, ownerUid: RIDERS[0].uid, name: defaultHorse.name, breed: 'Eesti sporthobune', birthYear: 2015,
  });

  const now = Date.now();

  // 10 competitions spread across past and future
  for (let i = 0; i < 10; i++) {
    const daysOffset = -180 + i * 40;  // -180d .. +180d (roughly past -> future)
    const isPast = daysOffset < -3;
    const isNear = Math.abs(daysOffset) < 5;
    const status: 'draft' | 'open' | 'closed' | 'running' | 'finished' =
      isPast ? 'finished' :
      isNear ? (Math.random() > 0.5 ? 'running' : 'open') :
      daysOffset < 14 ? 'open' :
      daysOffset < 30 ? 'open' : 'draft';

    const name = `[DEMO] ${pick(COMP_NAMES)} ${new Date(now + daysOffset * DAY).getFullYear()}`;
    const venue = pick(VENUES);

    const compId = await createCompetition({
      organizerUid,
      name,
      venue,
      date: now + daysOffset * DAY,
      registrationDeadline: now + Math.max(1, daysOffset - 3) * DAY,
      description: `Demo võistlus — korraldaja ${organizerDisplayName}. ${pick([
        'Soojendusala avatud 1h enne starti.',
        'TOP 3 saavad karikad.',
        'Osalejad palume saabuda vähemalt 30 minutit varem.',
        'Pakume kuuma teed ja kohvi kogu päeva vältel.',
        'Suur plats avatud 2 päeva enne võistlust.',
      ])}`,
      status,
      judgeUids: [],
    });

    // 3-5 classes per competition
    const classCount = 3 + Math.floor(Math.random() * 3);
    const chosenClasses = shuffle(CLASS_PRESETS).slice(0, classCount);

    for (let ci = 0; ci < chosenClasses.length; ci++) {
      const cl = chosenClasses[ci];
      const classId = await createClass(compId, {
        name: cl.name,
        heightCm: cl.heightCm,
        rules: cl.rules,
        timeLimitSeconds: cl.timeLimit,
        entryFeeCents: cl.fee,
        orderIndex: ci,
      });

      // Draft comps: no registrations
      if (status === 'draft') continue;

      // 5-30 registered riders per class
      const riderCount = 5 + Math.floor(Math.random() * 26);
      const chosenRiders = shuffle(RIDERS).slice(0, riderCount);
      const regIds: { regId: string; rider: typeof RIDERS[0]; horse: { id: string; name: string } }[] = [];

      for (const rider of chosenRiders) {
        const horse = (horsesByOwner[rider.uid] && horsesByOwner[rider.uid][0]) ?? defaultHorse;
        const regId = await createRegistration(compId, {
          riderUid: rider.uid,
          riderDisplayName: rider.name,
          horseId: horse.id,
          horseName: horse.name,
          classId,
          status: 'confirmed',
        });
        regIds.push({ regId, rider, horse });
        regCount++;
      }

      // For finished / running comps: generate starts with results
      if (status !== 'finished' && status !== 'running') continue;

      const firstStart = now + daysOffset * DAY + 10 * 3600_000; // 10 AM
      const intervalSec = 120;

      for (let si = 0; si < regIds.length; si++) {
        const r = regIds[si];
        const eliminated = Math.random() < 0.03;
        const withdrew = Math.random() < 0.02;
        let faults: number | null = null;
        let timeSeconds: number | null = null;
        // For finished: all have results; for running: first 60% have results
        const hasResult = status === 'finished' || si < Math.floor(regIds.length * 0.6);
        if (hasResult && !eliminated && !withdrew) {
          const res = randomResult(cl.timeLimit);
          faults = res.faults;
          timeSeconds = res.timeSeconds;
        }
        const startId = await createStart(compId, {
          classId,
          registrationId: r.regId,
          startNumber: si + 1,
          startTimeScheduled: firstStart + si * intervalSec * 1000,
          result: { faults, timeSeconds, eliminated, withdrew },
        });
        if (hasResult) {
          await updateStart(compId, startId, {
            enteredByUid: organizerUid,
            enteredAt: Date.now(),
          });
        }
        startCount++;
      }
    }
  }

  return { competitions: 10, registrations: regCount, starts: startCount };
}
