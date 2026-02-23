// Notification sound utility using Web Audio API
let audioContext = null;

export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Play a simple beep sound (no external file needed)
export const playNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800; // Hz - pleasant notification tone
    oscillator.type = 'sine';

    // Fade out effect
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Alternative: Play MP3 file (if you add a sound file later)
export const playNotificationMP3 = (url = '/sounds/notification.mp3') => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(console.warn);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};
