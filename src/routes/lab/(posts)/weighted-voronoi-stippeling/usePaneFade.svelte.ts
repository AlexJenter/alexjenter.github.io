interface PaneFadeOptions {
  fadeZone?: number;
  ready?: () => boolean;
}

export function usePaneFade(options: PaneFadeOptions = {}) {
  $effect(() => {
    if (options.ready && !options.ready()) return;

    const fadeZone = options.fadeZone ?? 150;

    const containerEl = document.querySelector<HTMLElement>(
      ".draggable-container",
    );
    const paneBodyEl = containerEl?.querySelector<HTMLElement>(".tp-rotv");
    if (!containerEl || !paneBodyEl) return;

    const compute = () => {
      const top = parseFloat(containerEl.style.top) || 0;
      const paneDocY = top + window.scrollY;
      const distance = window.innerHeight - paneDocY;
      const opacity = Math.min(1, Math.max(0, distance / fadeZone));
      paneBodyEl.style.opacity = String(opacity);
      paneBodyEl.style.pointerEvents = opacity < 0.05 ? "none" : "";
    };

    const observer = new MutationObserver(compute);
    observer.observe(containerEl, {
      attributes: true,
      attributeFilter: ["style"],
    });
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });
    compute();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
      paneBodyEl.style.opacity = "";
      paneBodyEl.style.pointerEvents = "";
    };
  });
}
