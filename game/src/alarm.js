// The alarm meter, the lockdown dash and the Ghost bust.
// The meter rises while any watcher sees the thief and decays in the dark.
// At 100, Standard mode starts a ten-second dash to the exit; Ghost mode
// busts the thief on the spot — and pays double if the heist succeeds.

import { ALARM } from './config.js';
import { anyCameraSees } from './cameras.js';
import { anyGuardSees } from './guards.js';

// Is anyone watching the thief right now?
export function anyoneSees(world) {
  return anyGuardSees(world) || anyCameraSees(world);
}

export function updateAlarm(world, dt) {
  if (world.phase !== 'playing') return;

  const seen = anyoneSees(world);
  if (seen) {
    world.alarm = Math.min(100, world.alarm + ALARM.risePerSecond * dt);
    world.alarmHot = true;
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.decayPerSecond * dt);
    world.alarmHot = false;
  }

  if (world.alarm >= 100 && !world.lockdown) {
    if (world.mode === 'ghost') {
      world.phase = 'busted';
      world.bustReason = 'alarm';
      world.bustGuard = null;
    } else {
      world.lockdown = true;
      world.lockdownLeft = ALARM.lockdownSeconds;
      world.banner = { text: 'LOCKDOWN! 10 SECONDS TO THE EXIT!', until: world.time + 2.5 };
      world.events.push({ type: 'lockdown' });
    }
  }

  if (world.lockdown) {
    world.lockdownLeft -= dt;
    if (world.lockdownLeft <= 0) {
      world.phase = 'busted';
      world.bustReason = 'lockdown';
      world.bustGuard = null;
    }
  }
}
