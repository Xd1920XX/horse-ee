import { Obstacle } from './types';

export type EquipmentNeeds = {
  poles: number;
  cups: number;
  standards: number;
  wallBlocks: number;
  liverpoolTrays: number;
  flagsPairs: number;
};

// Approx counts per obstacle type.
// Each vertical: 2 standards + 1 pole + 2 cups
// Oxer: 2 standards (actually 4 but reusable) → simplify 4 + 2 poles + 4 cups
// Triple: 6 standards + 3 poles + 6 cups
// Wall: 4 standards (end supports) + ~4 blocks
// Liverpool: 2 standards + 1 pole + 2 cups + 1 tray
export function computeEquipment(obstacles: Obstacle[]): EquipmentNeeds {
  const n: EquipmentNeeds = { poles: 0, cups: 0, standards: 0, wallBlocks: 0, liverpoolTrays: 0, flagsPairs: 0 };
  for (const o of obstacles) {
    switch (o.type) {
      case 'vertical':
      case 'combination':
        n.standards += 2; n.poles += 1; n.cups += 2; n.flagsPairs += 1; break;
      case 'oxer':
        n.standards += 4; n.poles += 2; n.cups += 4; n.flagsPairs += 1; break;
      case 'triple':
        n.standards += 6; n.poles += 3; n.cups += 6; n.flagsPairs += 1; break;
      case 'wall':
        n.standards += 4; n.wallBlocks += 4; n.flagsPairs += 1; break;
      case 'liverpool':
        n.standards += 2; n.poles += 1; n.cups += 2; n.liverpoolTrays += 1; n.flagsPairs += 1; break;
      case 'water':
        n.flagsPairs += 1; break;
      case 'cavaletti':
        n.poles += 1; n.standards += 2; break;
    }
  }
  return n;
}
