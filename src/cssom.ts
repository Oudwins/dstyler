import { Diff } from "./astDiffer";

export function createOrGetStylesheet(
  id: string,
  doc: Document,
  initialCSS?: string
) {
  // 1. search for stylesheet with id
  for (const s of Object.values(doc.styleSheets)) {
    if (s.title === id) {
      return s;
    }
  }

  const ssElement = doc.createElement("style");
  if (initialCSS) ssElement.innerHTML = initialCSS;
  // ssElement.title = id;
  // ssElement.id = id;
  doc.head.append(ssElement);

  return ssElement.sheet as CSSStyleSheet;
}

export function renderDiffs(diff: Diff[], ss: CSSStyleSheet) {
  for (const d of diff) {
    let curRoot = ss;
    switch (d.type) {
      case "raw":
        for (let i = 0; i < d.path.length - 1; i++) {
          curRoot = curRoot.cssRules[d.path[i] as number] as any;
        }

        curRoot.insertRule(d.value, d.path[d.path.length - 1]);
        break;
      case "node":
        for (let i = 0; i < d.path.length - 1; i++) {
          curRoot = curRoot.cssRules[d.path[i] as number] as any;
        }
        const last = d.path[d.path.length - 1] as number;
        if (!d.value) {
          curRoot.deleteRule(last);
        } else {
          if (curRoot.cssRules[last]) curRoot.deleteRule(last);
          curRoot.insertRule(d.value as string, last);
        }
        break;

      case "properties":
        for (let step of d.path) {
          curRoot = curRoot.cssRules[step] as any;
        }
        for (const [key, val] of Object.entries(d.value)) {
          //@ts-ignore
          curRoot.style[key] = val || "";
        }

        break;
    }
  }
}

export default {
  renderDiffs,
  createOrGetStylesheet,
};
