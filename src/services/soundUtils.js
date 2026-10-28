/**
 * Web Audio API Sound Utility
 * Synthesizes pure tones without requiring external audio files
 */

export function playLeadChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(659.25, now, 0.35); // E5 note
    playTone(880.0, now + 0.12, 0.55); // A5 note
  } catch (_) {
    // Audio context may be restricted by browser until user gesture
  }
}

/**
 * Realistic Biometric Confirmation Beep (ZKTeco / eSSL double-tone affirmative)
 */
export function playBiometricBeep(success = true) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (freq, startTime, duration, type = 'sine', gainLevel = 0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(gainLevel, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (success) {
      // Pleasant high-pitch double chirp: "Thank you!"
      playTone(1046.5, now, 0.1, 'sine', 0.25); // C6
      playTone(1318.5, now + 0.12, 0.22, 'sine', 0.28); // E6
    } else {
      // Low buzz: "Please try again"
      playTone(220, now, 0.25, 'triangle', 0.3);
    }
  } catch (_) {}
}
