// THE GILDED FOX — the alarm meter. The meter is the game's heartbeat: it
// rises while watchers are suspicious, alert, or filming you, and cools when
// you break away. At 100 the building goes into lockdown — ten seconds to
// reach the exit in Standard mode, instant bust in Ghost mode. The meter is
// always on screen, big and honest: no hidden timers, no surprise busts.
import { ALARM } from './config.js';

export const ALARM_CALM = 'calm';
export const ALARM_WARM = 'warm';
export const ALARM_HOT = 'hot';
export const ALARM_LOCKDOWN = 'lockdown';

/** A fresh alarm meter. */
export function makeAlarm() {
  return {
    value: 0,
    peak: 0,
    lockdown: false,
    lockdownLeft: 0,
    trippedAt: null,
  };
}

/** The meter's band, for the HUD's colour and the music's tension. */
export function alarmBand(alarm) {
  if (alarm.lockdown) return ALARM_LOCKDOWN;
  if (alarm.value >= 70) return ALARM_HOT;
  if (alarm.value >= 35) return ALARM_WARM;
  return ALARM_CALM;
}

/**
 * Step the meter one tick. `pressure` counts who is onto you right now:
 * { suspicious, alert, cameras }. Returns events: 'lockdown' when the meter
 * hits 100, 'cooling' when it drops back under 35 from hot.
 */
export function updateAlarm(alarm, pressure, dt, mode, time, events) {
  const wasHot = alarm.value >= 70;
  if (!alarm.lockdown) {
    const rise =
      pressure.suspicious * ALARM.suspiciousRise +
      pressure.alert * ALARM.alertRise +
      pressure.cameras * ALARM.cameraRise;
    if (rise > 0) {
      alarm.value = Math.min(100, alarm.value + rise * dt);
    } else {
      alarm.value = Math.max(0, alarm.value - ALARM.decay * dt);
    }
    alarm.peak = Math.max(alarm.peak, alarm.value);
    if (alarm.value >= 100) {
      alarm.lockdown = true;
      alarm.lockdownLeft = ALARM.lockdownSeconds;
      alarm.trippedAt = time;
      events.push({ type: mode === 'ghost' ? 'busted-alarm' : 'lockdown' });
    }
  } else {
    alarm.lockdownLeft -= dt;
    if (alarm.lockdownLeft <= 0) events.push({ type: 'busted-lockdown' });
  }
  if (wasHot && alarm.value < 35 && !alarm.lockdown) events.push({ type: 'cooling' });
}

/** An instant spike (a tripped laser). Lockdown still goes through update. */
export function spikeAlarm(alarm, amount) {
  if (alarm.lockdown) return;
  alarm.value = Math.min(100, alarm.value + amount);
  alarm.peak = Math.max(alarm.peak, alarm.value);
}
