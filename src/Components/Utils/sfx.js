// Simple short "pop" sound using Web Audio API
// Safe to call multiple times; will create/resume a shared AudioContext
export function playPop({ volume = 0.35, frequency = 700, duration = 0.12 } = {}) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return; // not supported

    if (!window.__famchat_audio_ctx) {
      window.__famchat_audio_ctx = new AudioCtx();
    }

    const ctx = window.__famchat_audio_ctx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);

    // Cleanup: disconnect after stop to avoid leaks
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  } catch (err) {
    // Fail silently; don't break the UI if audio isn't available
    console.warn('playPop failed', err);
  }
}
