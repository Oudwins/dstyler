import { Diff } from "./astDiffer";

export default function createDomInterface({
  id,
  initialCSS,
  doc,
}: {
  id: string;
  initialCSS?: string;
  doc: Document;
}) {
  const ssElement = doc.createElement("style");
  if (initialCSS) ssElement.innerHTML = initialCSS;
  // ssElement.title = id;
  // ssElement.id = id;
  doc.head.append(ssElement);
  //@ts-expect-error
  let ss: CSSStyleSheet = null;
  //@ts-expect-error
  ss = doc.styleSheets[doc.styleSheets.length - 1];
  // for (const s of Object.values(doc.styleSheets)) {
  // if (s.title === id) {
  // ss = s;
  // }
  // }
  if (ss === null) {
    throw new Error("Something went wrong");
  }

  return {
    ss,
    processDiffs(diff: Diff[]) {
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
    },
  };
}
