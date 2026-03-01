export interface TocTrackingOptions {
  itemSelector: string;
  anchorSelector: string;
  listSelector: string;
  emptySelector: string;
  targetAttribute: string;
  warningPrefix: string;
  isDev?: boolean;
  markerRatio?: number;
}

interface TocEntry {
  anchor: HTMLAnchorElement;
  targetId: string;
  section: HTMLElement;
}

const getTargetId = (anchor: Element | null, targetAttribute: string) =>
  anchor?.getAttribute(targetAttribute) || "";

export const validateTocTargets = (
  root: ParentNode,
  options: TocTrackingOptions,
): void => {
  const tocItems = Array.from(
    root.querySelectorAll<HTMLElement>(options.itemSelector),
  );

  for (const item of tocItems) {
    const anchor = item.querySelector(options.anchorSelector);
    const targetId = getTargetId(anchor, options.targetAttribute);
    if (!targetId) {
      item.remove();
      continue;
    }

    if (!document.getElementById(targetId)) {
      item.remove();
      if (options.isDev) {
        console.warn(
          `[${options.warningPrefix}] TOC target not found: #${targetId}`,
        );
      }
    }
  }

  const tocList = root.querySelector(options.listSelector);
  const tocEmpty = root.querySelector<HTMLElement>(options.emptySelector);
  if (tocList && tocEmpty) {
    const remaining = tocList.querySelectorAll(options.itemSelector).length;
    if (remaining === 0) {
      tocEmpty.removeAttribute("hidden");
    } else {
      tocEmpty.setAttribute("hidden", "");
    }
  }
};

export const setupTocActiveTracking = (
  root: ParentNode,
  options: TocTrackingOptions,
): void => {
  const tocAnchors = Array.from(
    root.querySelectorAll<HTMLAnchorElement>(options.anchorSelector),
  );
  const tocEntries: TocEntry[] = tocAnchors
    .map((anchor) => {
      const targetId = getTargetId(anchor, options.targetAttribute);
      if (!targetId) {
        return null;
      }

      const section = document.getElementById(targetId);
      if (!section) {
        return null;
      }

      return { anchor, targetId, section };
    })
    .filter((entry): entry is TocEntry => Boolean(entry));

  if (tocEntries.length === 0) {
    return;
  }

  const markerRatio = options.markerRatio ?? 0;
  let activeTargetId = "";
  let rafPending = false;

  const setActiveToc = (targetId: string) => {
    if (activeTargetId === targetId) {
      return;
    }

    activeTargetId = targetId;
    for (const entry of tocEntries) {
      const isActive = entry.targetId === targetId;
      entry.anchor.classList.toggle("is-active", isActive);
      if (isActive) {
        entry.anchor.setAttribute("aria-current", "location");
      } else {
        entry.anchor.removeAttribute("aria-current");
      }
    }
  };

  const evaluateActiveToc = () => {
    const markerY = window.innerHeight * markerRatio;
    let crossingEntry: TocEntry | null = null;
    let firstBelowEntry: TocEntry | null = null;
    let lastEntry: TocEntry | null = null;

    for (const entry of tocEntries) {
      const rect = entry.section.getBoundingClientRect();
      lastEntry = entry;

      if (rect.top <= markerY && rect.bottom > markerY) {
        crossingEntry = entry;
        break;
      }

      if (!firstBelowEntry && rect.top > markerY) {
        firstBelowEntry = entry;
      }
    }

    const nextActiveEntry = crossingEntry || firstBelowEntry || lastEntry;
    if (!nextActiveEntry) {
      return;
    }

    setActiveToc(nextActiveEntry.targetId);
  };

  const requestEvaluate = () => {
    if (rafPending) {
      return;
    }

    rafPending = true;
    window.requestAnimationFrame(() => {
      rafPending = false;
      evaluateActiveToc();
    });
  };

  window.addEventListener("scroll", requestEvaluate, { passive: true });
  window.addEventListener("resize", requestEvaluate);

  for (const entry of tocEntries) {
    entry.anchor.addEventListener("click", () => {
      setActiveToc(entry.targetId);
    });
  }

  requestEvaluate();
};
