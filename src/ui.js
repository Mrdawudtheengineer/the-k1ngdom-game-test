import { speak } from './audio.js';

export function initUI({ onPlay, onTutorial, onSettings, onCustomize }) {
  const hud = document.querySelector('#hud');
  const dialogueEl = document.querySelector('#dialogue');
  const menuButtons = document.querySelectorAll('.menu-btn');

  menuButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'play') onPlay();
      if (action === 'tutorial') onTutorial();
      if (action === 'settings') onSettings();
      if (action === 'customize') onCustomize();
    });
  });

  return {
    showHud() {
      hud.classList.remove('hidden');
      hud.classList.add('visible');
    },
    setDialogue(text, voiceKey) {
      dialogueEl.textContent = text;
      speak(text, voiceKey);
    },
  };
}
