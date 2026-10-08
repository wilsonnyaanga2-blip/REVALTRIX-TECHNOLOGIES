let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

export async function enableNotificationSound(): Promise<void> {
  const context = getAudioContext();

  if (context.state === 'suspended') {
    await context.resume();
  }
}

export async function playNotificationSound(): Promise<void> {
  const context = getAudioContext();

  if (context.state === 'suspended') {
    await context.resume();
  }

  if (context.state !== 'running') {
    return;
  }

  const now = context.currentTime;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(1174.66, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.6);

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 650);
  });
}
