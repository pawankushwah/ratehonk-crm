/**
 * Plays a bell-like two-tone notification ring (ding-dong).
 * Used when new notifications arrive.
 */
export function playNotificationRing() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    playTone(880, 0, 0.12);
    playTone(660, 0.15, 0.2);
  } catch (_) {}
}
