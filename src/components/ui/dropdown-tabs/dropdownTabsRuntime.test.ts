// @vitest-environment jsdom

import { hydrateDropdownTabs } from './dropdownTabsRuntime';

const buildFixture = () => {
  document.body.innerHTML = `
    <section>
      <div
        id="projects-tabs"
        data-dropdown-tabs
        data-dropdown-tabs-active="first-project"
        data-dropdown-tabs-open="false"
      >
        <button
          type="button"
          data-dropdown-tabs-trigger
          aria-expanded="false"
          aria-controls="projects-tabs-menu"
        >
          <span data-dropdown-tabs-trigger-label></span>
        </button>
        <div
          id="projects-tabs-menu"
          data-dropdown-tabs-menu
          role="tablist"
          hidden
        >
          <button
            type="button"
            id="projects-tabs-tab-first-project"
            data-dropdown-tabs-option="first-project"
            data-dropdown-tabs-label="First ERC-721 Project"
            aria-controls="projects-panel-first-project"
            role="tab"
          >
            First ERC-721 Project
          </button>
          <button
            type="button"
            id="projects-tabs-tab-gaming"
            data-dropdown-tabs-option="gaming"
            data-dropdown-tabs-label="Breakthrough Gaming-NFT Integration"
            aria-controls="projects-panel-gaming"
            role="tab"
          >
            Breakthrough Gaming-NFT Integration
          </button>
          <button
            type="button"
            id="projects-tabs-tab-artsale"
            data-dropdown-tabs-option="artsale"
            data-dropdown-tabs-label="$69M Record-breaking Artsale"
            aria-controls="projects-panel-artsale"
            role="tab"
          >
            $69M Record-breaking Artsale
          </button>
        </div>
      </div>
      <div
        id="projects-panel-first-project"
        role="tabpanel"
        aria-labelledby="projects-tabs-tab-first-project"
      >
        First panel
      </div>
      <div
        id="projects-panel-gaming"
        role="tabpanel"
        aria-labelledby="projects-tabs-tab-gaming"
      >
        Second panel
      </div>
      <div
        id="projects-panel-artsale"
        role="tabpanel"
        aria-labelledby="projects-tabs-tab-artsale"
      >
        Third panel
      </div>
    </section>
  `;

  const root = document.querySelector<HTMLElement>('[data-dropdown-tabs]');
  const trigger = document.querySelector<HTMLButtonElement>(
    '[data-dropdown-tabs-trigger]',
  );
  const menu = document.querySelector<HTMLElement>('[data-dropdown-tabs-menu]');
  const options = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-dropdown-tabs-option]'),
  );
  const panels = [
    document.getElementById('projects-panel-first-project'),
    document.getElementById('projects-panel-gaming'),
    document.getElementById('projects-panel-artsale'),
  ];

  if (
    !root ||
    !trigger ||
    !menu ||
    options.length !== 3 ||
    panels.some((panel) => !panel)
  ) {
    throw new Error('Failed to build dropdown tabs fixture.');
  }

  return {
    root,
    trigger,
    menu,
    options,
    panels: panels as HTMLElement[],
  };
};

describe('dropdownTabsRuntime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with the configured active option and panel', () => {
    const { root, options, panels } = buildFixture();

    const controller = hydrateDropdownTabs(root);

    expect(controller).not.toBeNull();
    expect(root).toHaveAttribute('data-dropdown-tabs-active', 'first-project');
    expect(
      root.querySelector<HTMLElement>('[data-dropdown-tabs-trigger-label]'),
    ).toHaveTextContent('First ERC-721 Project');
    expect(options[0]).toHaveAttribute('hidden');
    expect(options[0]).toHaveAttribute('aria-hidden', 'true');
    expect(options[1]).not.toHaveAttribute('hidden');
    expect(panels[0]).not.toHaveAttribute('hidden');
    expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
    expect(panels[1]).toHaveAttribute('hidden');
    expect(panels[2]).toHaveAttribute('hidden');
  });

  it('opens and closes the options menu from the trigger', () => {
    const { root, trigger, menu, options } = buildFixture();

    hydrateDropdownTabs(root);

    trigger.click();
    expect(root).toHaveAttribute('data-dropdown-tabs-open', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menu.hidden).toBe(false);
    expect(options[0]).toHaveAttribute('hidden');
    expect(options[1]).not.toHaveAttribute('hidden');

    trigger.click();
    expect(root).toHaveAttribute('data-dropdown-tabs-open', 'false');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(menu.hidden).toBe(true);
  });

  it('updates the active option and linked panel on click', () => {
    const { root, trigger, options, panels } = buildFixture();

    hydrateDropdownTabs(root);

    trigger.click();
    options[1]?.click();

    expect(root).toHaveAttribute('data-dropdown-tabs-active', 'gaming');
    expect(
      root.querySelector<HTMLElement>('[data-dropdown-tabs-trigger-label]'),
    ).toHaveTextContent('Breakthrough Gaming-NFT Integration');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');
    expect(panels[1]).toHaveAttribute('aria-hidden', 'false');
  });

  it('supports keyboard interaction and escape close behavior', () => {
    const { root, trigger, options } = buildFixture();

    hydrateDropdownTabs(root);

    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(root).toHaveAttribute('data-dropdown-tabs-open', 'true');

    expect(document.activeElement).toBe(options[1]);

    options[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[2]);

    options[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(root).toHaveAttribute('data-dropdown-tabs-active', 'artsale');
    expect(root).toHaveAttribute('data-dropdown-tabs-open', 'false');
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    options[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(root).toHaveAttribute('data-dropdown-tabs-open', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps only the active panel visible and updates aria state', () => {
    const { root, options, panels } = buildFixture();

    const controller = hydrateDropdownTabs(root);
    controller?.setActive('artsale');

    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('tabindex', '0');
    expect(options[2]).toHaveAttribute('hidden');
    expect(options[2]).toHaveAttribute('aria-hidden', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[0]).toHaveAttribute('tabindex', '-1');
    expect(options[0]).not.toHaveAttribute('hidden');
    expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
    expect(panels[2]).toHaveAttribute('aria-hidden', 'false');
    expect(panels[2]).not.toHaveAttribute('hidden');
  });
});
