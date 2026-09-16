export type CrewId = 'rideOn' | 'push';

export interface Crew {
  id: CrewId;
  label: string;
  speed: number;
  canDuck: boolean;
  height: number;
  duckHeight: number;
}

export const CREWS: Record<CrewId, Crew> = {
  rideOn: { id: 'rideOn', label: 'Ride-on crew', speed: 165, canDuck: false, height: 44, duckHeight: 44 },
  push: { id: 'push', label: 'Push crew', speed: 128, canDuck: true, height: 43, duckHeight: 34 },
};
