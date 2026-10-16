const musicButton = document.querySelector('.sound-button');
const backgroundMusic = document.querySelector('#background-music');

if (musicButton && backgroundMusic) {
  backgroundMusic.volume = 0.1;
  let shouldPlay = false;
  let requestId = 0;

  function updateMusicButton() {
    const label = shouldPlay ? 'Поставить музыку на паузу' : 'Включить музыку';
    musicButton.setAttribute('aria-pressed', String(shouldPlay));
    musicButton.setAttribute('aria-label', label);
    musicButton.title = label;
  }

  musicButton.addEventListener('click', async () => {
    const currentRequest = ++requestId;
    if (shouldPlay) {
      shouldPlay = false;
      backgroundMusic.pause();
      updateMusicButton();
      return;
    }

    shouldPlay = true;
    updateMusicButton();

    try {
      await backgroundMusic.play();
      if (!shouldPlay) {
        backgroundMusic.pause();
      }
    } catch (error) {
      if (currentRequest === requestId) {
        shouldPlay = false;
        updateMusicButton();
        console.error('Не удалось воспроизвести музыку:', error);
      }
    }
  });
}
