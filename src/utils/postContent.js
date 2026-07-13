const ALLOWED_TAGS = new Set([
  "A", "BLOCKQUOTE", "BR", "EM", "H1", "H2", "H3", "IMG", "LI",
  "OL", "P", "PRE", "S", "STRONG", "U", "UL", "SPAN",
]);

const ALLOWED_CLASSES = new Set([
  "ql-align-center", "ql-align-right", "ql-align-justify",
  "ql-indent-1", "ql-indent-2", "ql-indent-3", "ql-indent-4",
  "ql-size-small", "ql-size-large", "ql-size-huge",
]);

const isSafeUrl = (value, allowDataImage = false) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:") ||
    (allowDataImage && normalized.startsWith("data:image/"));
};

export const sanitizePostHtml = (html = "") => {
  if (typeof window === "undefined" || !html) return "";
  const documentNode = new DOMParser().parseFromString(html, "text/html");

  const cleanNode = (node) => {
    [...node.children].forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }

      [...child.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name === "class") {
          const classes = attribute.value.split(/\s+/).filter((item) => ALLOWED_CLASSES.has(item));
          if (classes.length) child.setAttribute("class", classes.join(" "));
          else child.removeAttribute("class");
          return;
        }

        if (child.tagName === "A" && name === "href" && isSafeUrl(attribute.value)) return;
        if (child.tagName === "A" && ["target", "rel"].includes(name)) return;
        if (child.tagName === "IMG" && name === "src" && isSafeUrl(attribute.value)) return;
        if (child.tagName === "IMG" && ["alt", "title"].includes(name)) return;
        child.removeAttribute(attribute.name);
      });

      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer nofollow");
      }
      cleanNode(child);
    });
  };

  cleanNode(documentNode.body);
  return documentNode.body.innerHTML;
};

export const postHtmlToText = (html = "") => {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return (documentNode.body.textContent || "").replace(/\s+/g, " ").trim();
};

export const normalizeSearchText = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const getPostHtml = (post = {}) => post.contentHtml || (post.content ? `<p>${escapeHtml(post.content).replace(/\n/g, "<br>")}</p>` : "");

const escapeHtml = (value = "") => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
