// Keep short Russian function words with the following word only when a line wraps.
window.normalizeTypography = (root = document.body) => {
  const shortWords = /(?<![\p{L}\p{N}_\-‑–])(?:и|не|или|в|во|на|с|со|к|ко|у|о|об|обо|от|ото|до|из|изо|за|по|под|подо|над|надо|при|про|для|без|безо|через|перед|передо|между|меж|ради|около|возле|вдоль|вокруг|вне|внутри|после|против|среди|сквозь|из-за|из-под)[ \t\u00a0]+(?=\S)/giu;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement.closest('script, style, pre, code, textarea, [contenteditable]')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    node.textContent = node.textContent.replace(shortWords, match =>
      match.replace(/[ \t\u00a0]+$/u, '\u00a0'),
    );
  }
};

window.normalizeTypography();
