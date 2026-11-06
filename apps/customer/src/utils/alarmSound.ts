// Web Audio API safety alarm synthesizer
let audioCtx: AudioContext | null = null;
let alarmInterval: any = null;
let isAlarmRunning = false;

export function playSafetyAlarmSound() {
  if (isAlarmRunning) return;
  isAlarmRunning = true;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const playBeep = () => {
      if (!isAlarmRunning || !audioCtx) return;
      try {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.15); // Higher pitch

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    };

    // Immediate first beep
    playBeep();
    // Repeating beeps every 800ms
    alarmInterval = setInterval(playBeep, 800);
  } catch (err) {
    console.warn('Could not initialize audio context:', err);
  }
}

export function stopSafetyAlarmSound() {
  isAlarmRunning = false;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {}
    audioCtx = null;
  }
}

