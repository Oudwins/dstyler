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
            for (let step of d.path) {
              if (!curRoot.cssRules[step]) {
                curRoot.insertRule(d.value, step);
                break;
              } else {
                curRoot = curRoot.cssRules[step] as any;
              }
            }
        }
      }
    },
  };
}
