export type CompetitionStatus = 'draft' | 'open' | 'closed' | 'running' | 'finished';

export type Competition = {
  id: string;
  organizerUid: string;
  name: string;
  venue: string;
  date: number;              // epoch ms
  registrationDeadline: number;
  description?: string;
  status: CompetitionStatus;
  judgeUids: string[];
  createdAt: number;
};

export type CompetitionClass = {
  id: string;
  name: string;              // "90 cm", "Rist", "Maalatt"
  heightCm: number;
  rules: 'A/A' | 'A/A_piiraja' | 'TableC' | 'other';
  timeLimitSeconds: number;
  entryFeeCents?: number;
  courseId?: string;
  orderIndex: number;
};

export type Registration = {
  id: string;
  riderUid: string;
  riderDisplayName: string;
  horseId: string;
  horseName: string;
  classId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'withdrawn';
  createdAt: number;
};

export type Horse = {
  id: string;
  ownerUid: string;
  name: string;
  breed?: string;
  birthYear?: number;
  passportNumber?: string;
};

export type StartEntry = {
  id: string;
  classId: string;
  registrationId: string;
  startNumber: number;
  startTimeScheduled: number;
  startTimeActual?: number;
  result: {
    faults: number | null;
    timeSeconds: number | null;
    eliminated: boolean;
    withdrew: boolean;
  };
  enteredByUid?: string;
  enteredAt?: number;
};
