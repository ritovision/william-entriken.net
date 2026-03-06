interface DropdownTabsElements {
  root: HTMLElement;
  trigger: HTMLButtonElement;
  triggerLabel: HTMLElement;
  menu: HTMLElement;
  options: HTMLButtonElement[];
}

interface DropdownOptionMeta {
  id: string;
  label: string;
  controlsId: string;
}

interface DropdownTabsController {
  open: () => void;
  close: (restoreFocus?: boolean) => void;
  setActive: (targetId: string) => void;
}

interface DropdownTabsOptionEntry {
  button: HTMLButtonElement;
  meta: DropdownOptionMeta;
}

const readElements = (root: HTMLElement): DropdownTabsElements | null => {
  const trigger = root.querySelector<HTMLButtonElement>(
    '[data-dropdown-tabs-trigger]',
  );
  const triggerLabel = root.querySelector<HTMLElement>(
    '[data-dropdown-tabs-trigger-label]',
  );
  const menu = root.querySelector<HTMLElement>('[data-dropdown-tabs-menu]');
  const options = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-dropdown-tabs-option]'),
  );

  if (!trigger || !triggerLabel || !menu || options.length === 0) {
    return null;
  }

  return {
    root,
    trigger,
    triggerLabel,
    menu,
    options,
  };
};

const readOptionMeta = (
  option: HTMLButtonElement,
): DropdownOptionMeta | null => {
  const id = option.getAttribute('data-dropdown-tabs-option');
  const label = option.getAttribute('data-dropdown-tabs-label');
  const controlsId = option.getAttribute('aria-controls');

  if (!id || !label || !controlsId) {
    return null;
  }

  return {
    id,
    label,
    controlsId,
  };
};

const setExpandedState = (
  elements: DropdownTabsElements,
  isOpen: boolean,
): void => {
  elements.root.setAttribute('data-dropdown-tabs-open', String(isOpen));
  elements.trigger.setAttribute('aria-expanded', String(isOpen));
  elements.menu.hidden = !isOpen;
};

const setPanelState = (
  option: DropdownOptionMeta,
  optionButton: HTMLButtonElement,
  isActive: boolean,
): void => {
  optionButton.classList.toggle('is-active', isActive);
  optionButton.setAttribute('aria-selected', String(isActive));
  optionButton.tabIndex = isActive ? 0 : -1;

  const panel = document.getElementById(option.controlsId);
  if (!panel) {
    return;
  }

  panel.classList.toggle('is-active', isActive);
  panel.setAttribute('aria-hidden', String(!isActive));
  if (isActive) {
    panel.removeAttribute('hidden');
  } else {
    panel.setAttribute('hidden', '');
  }
};

export const hydrateDropdownTabs = (
  root: HTMLElement,
): DropdownTabsController | null => {
  if (root.dataset.dropdownTabsBound === 'true') {
    return null;
  }

  const elements = readElements(root);
  if (!elements) {
    return null;
  }

  const optionMeta = elements.options
    .map((option) => ({
      button: option,
      meta: readOptionMeta(option),
    }))
    .filter(
      (option): option is DropdownTabsOptionEntry => option.meta !== null,
    );

  if (optionMeta.length === 0) {
    return null;
  }

  root.dataset.dropdownTabsBound = 'true';

  const allowedIds = optionMeta.map((option) => option.meta.id);
  const getActiveId = (): string =>
    root.getAttribute('data-dropdown-tabs-active') || optionMeta[0].meta.id;

  const getVisibleOptions = (): DropdownTabsOptionEntry[] =>
    optionMeta.filter((option) => option.meta.id !== getActiveId());

  const focusOption = (targetId: string): void => {
    const target = getVisibleOptions().find(
      (option) => option.meta.id === targetId,
    );
    target?.button.focus();
  };

  const setActive = (targetId: string, shouldEmit: boolean): void => {
    if (!allowedIds.includes(targetId)) {
      return;
    }

    root.setAttribute('data-dropdown-tabs-active', targetId);

    for (const option of optionMeta) {
      const isActive = option.meta.id === targetId;
      if (isActive) {
        elements.triggerLabel.textContent = option.meta.label;
      }
      option.button.hidden = isActive;
      option.button.setAttribute('aria-hidden', String(isActive));
      setPanelState(option.meta, option.button, isActive);
    }

    if (shouldEmit) {
      root.dispatchEvent(
        new CustomEvent<{ id: string }>('dropdown-tabs:change', {
          detail: { id: targetId },
          bubbles: true,
        }),
      );
    }
  };

  const close = (restoreFocus = false): void => {
    setExpandedState(elements, false);
    if (restoreFocus) {
      elements.trigger.focus();
    }
  };

  const open = (): void => {
    setExpandedState(elements, true);
  };

  const moveFocus = (
    currentButton: HTMLButtonElement,
    direction: 'next' | 'previous' | 'first' | 'last',
  ): void => {
    const visibleOptions = getVisibleOptions();
    const currentIndex = visibleOptions.findIndex(
      (option) => option.button === currentButton,
    );
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % visibleOptions.length;
    } else if (direction === 'previous') {
      nextIndex =
        (currentIndex - 1 + visibleOptions.length) % visibleOptions.length;
    } else if (direction === 'first') {
      nextIndex = 0;
    } else if (direction === 'last') {
      nextIndex = visibleOptions.length - 1;
    }

    visibleOptions[nextIndex]?.button.focus();
  };

  elements.trigger.addEventListener('click', () => {
    const isOpen = root.getAttribute('data-dropdown-tabs-open') === 'true';
    if (isOpen) {
      close();
      return;
    }

    open();
    const firstVisibleOption = getVisibleOptions()[0];
    firstVisibleOption?.button.focus();
  });

  elements.trigger.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      return;
    }

    event.preventDefault();
    open();
    const visibleOptions = getVisibleOptions();
    if (event.key === 'ArrowUp') {
      visibleOptions[visibleOptions.length - 1]?.button.focus();
      return;
    }

    visibleOptions[0]?.button.focus();
  });

  for (const option of optionMeta) {
    option.button.addEventListener('click', () => {
      close();
      setActive(option.meta.id, true);
    });

    option.button.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        close(true);
        setActive(option.meta.id, true);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(option.button, 'next');
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(option.button, 'previous');
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        moveFocus(option.button, 'first');
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        moveFocus(option.button, 'last');
      }
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target as Node | null;
    if (target && root.contains(target)) {
      return;
    }

    close();
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  });

  setExpandedState(elements, false);
  setActive(getActiveId(), false);

  return {
    open,
    close,
    setActive: (targetId: string) => {
      setActive(targetId, true);
    },
  };
};

export const initDropdownTabs = (scope: ParentNode = document): void => {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>('[data-dropdown-tabs]'),
  );

  for (const root of roots) {
    hydrateDropdownTabs(root);
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initDropdownTabs(), {
      once: true,
    });
  } else {
    initDropdownTabs();
  }

  document.addEventListener('astro:page-load', () => initDropdownTabs());
}
