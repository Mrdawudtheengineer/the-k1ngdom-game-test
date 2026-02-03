const VOICES = {
  villager: { voiceName: 'Google UK English Male', pitch: 1.0, rate: 0.9 },
  merchant: { voiceName: 'Google US English', pitch: 1.1, rate: 1.0 },
  guard: { voiceName: 'Google UK English Female', pitch: 0.9, rate: 0.85 },
  assistant: { voiceName: 'Google US English', pitch: 1.2, rate: 1.0 },
};

let availableVoices = [];
let canSpeak = true;

export function initVoices() {
  availableVoices = speechSynthesis.getVoices();
}

export function speak(text, profileKey) {
  if (!canSpeak) return;
  const profile = VOICES[profileKey] || VOICES.villager;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  utterance.voice = availableVoices.find((voice) => voice.name === profile.voiceName) || availableVoices[0];
  canSpeak = false;
  utterance.onend = () => {
    canSpeak = true;
  };
  speechSynthesis.speak(utterance);
}

export function hookVoiceEvents() {
  initVoices();
  speechSynthesis.onvoiceschanged = initVoices;
}
