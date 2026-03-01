const NAV_CHROME_SELECTORS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "[data-mobile-nav]",
  ".desktop-sidebar",
  "[data-ai-assist-modal]",
].join(", ");

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const htmlToMarkdown = (html: string): string => {
  const root = document.createElement("div");
  root.innerHTML = html;

  let markdown = "";

  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent || "");
      if (text) {
        if (markdown && !markdown.endsWith("\n") && !markdown.endsWith(" ")) {
          markdown += " ";
        }
        markdown += text;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
        markdown += `\n\n# ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "h2":
        markdown += `\n\n## ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "h3":
        markdown += `\n\n### ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "h4":
        markdown += `\n\n#### ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "h5":
        markdown += `\n\n##### ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "h6":
        markdown += `\n\n###### ${normalizeText(element.textContent || "")}\n\n`;
        return;
      case "p":
      case "section":
      case "article":
      case "div":
        markdown += "\n\n";
        break;
      case "br":
        markdown += "\n";
        return;
      case "strong":
      case "b":
        markdown += `**${normalizeText(element.textContent || "")}**`;
        return;
      case "em":
      case "i":
        markdown += `*${normalizeText(element.textContent || "")}*`;
        return;
      case "code":
        if (element.parentElement?.tagName.toLowerCase() === "pre") {
          markdown += `\n\n\`\`\`\n${element.textContent || ""}\n\`\`\`\n\n`;
        } else {
          markdown += `\`${element.textContent || ""}\``;
        }
        return;
      case "a": {
        const href = element.getAttribute("href") || "";
        const label = normalizeText(element.textContent || href || "Link");
        markdown += `[${label}](${href})`;
        return;
      }
      case "ul":
      case "ol":
        markdown += "\n";
        break;
      case "li":
        markdown += "\n- ";
        break;
      default:
        break;
    }

    for (const child of Array.from(element.childNodes)) {
      processNode(child);
    }

    if (
      tagName === "p" ||
      tagName === "section" ||
      tagName === "article" ||
      tagName === "div"
    ) {
      markdown += "\n";
    }
  };

  processNode(root);

  return markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
};

const getMainContent = (): HTMLElement => {
  return (
    document.querySelector<HTMLElement>("main") ||
    document.querySelector<HTMLElement>("article") ||
    document.querySelector<HTMLElement>('[role="main"]') ||
    document.body
  );
};

export const copyPageAsMarkdown = async (): Promise<void> => {
  const mainContent = getMainContent();
  const contentClone = mainContent.cloneNode(true);

  if (!(contentClone instanceof HTMLElement)) {
    throw new Error("Unable to clone page content for markdown conversion.");
  }

  for (const element of Array.from(
    contentClone.querySelectorAll(NAV_CHROME_SELECTORS),
  )) {
    element.remove();
  }

  const pageTitle = document.title.trim() || "Untitled Page";
  const pageUrl = window.location.href;
  const bodyMarkdown = htmlToMarkdown(contentClone.innerHTML);
  const fullMarkdown = `# ${pageTitle}\n\nSource: ${pageUrl}\n\n---\n\n${bodyMarkdown}`;

  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    throw new Error("Clipboard API is not available in this browser context.");
  }

  await navigator.clipboard.writeText(fullMarkdown);
};
