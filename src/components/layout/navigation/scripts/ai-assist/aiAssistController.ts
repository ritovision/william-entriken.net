import { isAIProvider, openAIDeeplink } from "./aiDeeplinks";
import { copyPageAsMarkdown } from "./markdownCopy";

const OPEN_EVENT_NAME = "ai-assist:open";

interface AiAssistRefs {
  modal: HTMLElement;
  prompt: HTMLTextAreaElement;
  copyLabel: HTMLElement;
  copyStatus: HTMLElement;
}

let isInitialized = false;

const getDefaultPrompt = (): string =>
  `${window.location.href}\n\nExplain this page to me.`;

const resolveRefs = (): AiAssistRefs | null => {
  const modal = document.querySelector<HTMLElement>("[data-ai-assist-modal]");
  const prompt =
    document.querySelector<HTMLTextAreaElement>("[data-ai-prompt]");
  const copyLabel = document.querySelector<HTMLElement>("[data-ai-copy-label]");
  const copyStatus = document.querySelector<HTMLElement>(
    "[data-ai-copy-status]",
  );

  if (!modal || !prompt || !copyLabel || !copyStatus) {
    return null;
  }

  return { modal, prompt, copyLabel, copyStatus };
};

export const initAiAssistController = (): void => {
  if (isInitialized) {
    return;
  }

  const refs = resolveRefs();
  if (!refs) {
    return;
  }

  isInitialized = true;

  const defaultCopyLabel =
    refs.copyLabel.textContent?.trim() || "Copy Page as markdown";
  let resetCopyTimer: number | null = null;

  const isModalOpen = (): boolean => refs.modal.classList.contains("is-open");

  const resetCopyFeedback = (): void => {
    refs.copyLabel.textContent = defaultCopyLabel;
    refs.copyStatus.textContent = "";
    if (resetCopyTimer !== null) {
      window.clearTimeout(resetCopyTimer);
      resetCopyTimer = null;
    }
  };

  const setCopyFeedback = (label: string, statusMessage: string): void => {
    refs.copyLabel.textContent = label;
    refs.copyStatus.textContent = statusMessage;
    if (resetCopyTimer !== null) {
      window.clearTimeout(resetCopyTimer);
    }

    resetCopyTimer = window.setTimeout(() => {
      refs.copyLabel.textContent = defaultCopyLabel;
      refs.copyStatus.textContent = "";
      resetCopyTimer = null;
    }, 2000);
  };

  const resetPrompt = (): void => {
    refs.prompt.value = getDefaultPrompt();
    refs.prompt.scrollTop = 0;
  };

  const openModal = (): void => {
    if (isModalOpen()) {
      return;
    }

    refs.modal.hidden = false;
    refs.modal.classList.add("is-open");
    refs.modal.setAttribute("aria-hidden", "false");
    resetPrompt();
    resetCopyFeedback();
    refs.prompt.focus();
  };

  const closeModal = (): void => {
    if (!isModalOpen()) {
      return;
    }

    refs.modal.classList.remove("is-open");
    refs.modal.setAttribute("aria-hidden", "true");
    refs.modal.hidden = true;
    resetPrompt();
    resetCopyFeedback();
  };

  const handleProviderClick = (provider: string | null): void => {
    if (!isAIProvider(provider)) {
      return;
    }

    openAIDeeplink(provider, refs.prompt.value);
  };

  const handleCopyClick = async (): Promise<void> => {
    try {
      await copyPageAsMarkdown();
      setCopyFeedback("Copied!", "Copied!");
    } catch (_error: unknown) {
      setCopyFeedback("Failed to Copy!", "Failed to copy page as markdown.");
    }
  };

  document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const closeTrigger = target.closest<HTMLElement>("[data-ai-close-modal]");
    if (closeTrigger && refs.modal.contains(closeTrigger)) {
      event.preventDefault();
      closeModal();
      return;
    }

    const providerButton =
      target.closest<HTMLButtonElement>("[data-ai-provider]");
    if (providerButton && refs.modal.contains(providerButton)) {
      event.preventDefault();
      handleProviderClick(providerButton.getAttribute("data-ai-provider"));
      return;
    }

    const copyButton = target.closest<HTMLButtonElement>("[data-ai-copy]");
    if (copyButton && refs.modal.contains(copyButton)) {
      event.preventDefault();
      void handleCopyClick();
      return;
    }

    const openTrigger = target.closest<HTMLElement>("[data-ai-open-modal]");
    if (openTrigger) {
      event.preventDefault();
      openModal();
    }
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && isModalOpen()) {
      closeModal();
    }
  });

  document.addEventListener(OPEN_EVENT_NAME, () => {
    openModal();
  });

  resetPrompt();
  resetCopyFeedback();
};
