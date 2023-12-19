import * as postcss from "postcss-js";
import cssomI from "./cssom";
import astInterface from "./astInterface";

export function createDynamicStyleSheetHandlerFactory(
  cssom: typeof cssomI,
  astom: typeof astInterface
): any {
  return function createDynamicStyleSheetHandler({
    id,
    doc,
    initialState,
  }: {
    id: string;
    doc: Document | null;
    initialState?: postcss.CssInJs;
  }) {
    const ast = postcss.parse(initialState || {});
    let ss: CSSStyleSheet | null = null;
    let dom: Document;
    updateDocument(doc as Document);
    let qpath: string[] = [];
    function reset() {
      // fastest way to empty array
      qpath.length = 0;
    }
    function updateDocument(doc: Document) {
      if (doc !== dom) {
        if (ss) ss.ownerNode?.remove();
        dom = doc;
        ss = cssom.createOrGetStylesheet(id, dom, ast.toString());
      }
    }

    return {
      media(rule: string) {
        const selector = "@media " + rule;
        qpath.push(selector);
        return this;
      },
      selector(s: string) {
        qpath.push(s);
        return this;
      },
      set(values: postcss.CssInJs) {
        const diffs = astom.setNode(qpath, values, ast);
        if (ss) cssom.renderDiffs(diffs, ss);
        reset();
      },
      setForce(values: postcss.CssInJs) {
        if (qpath.length === 0)
          throw new Error("cannot target root with setForce");

        const diffs = astom.setNodeForce(qpath, values, ast);
        if (ss) cssom.renderDiffs(diffs, ss);
        reset();
      },
      add(values: postcss.CssInJs) {
        const diffs = astom.addToNode(qpath, values, ast);
        if (ss) cssom.renderDiffs(diffs, ss);
        reset();
      },
      get() {
        const n = astom.getNode(qpath, ast);
        reset();
        return postcss.objectify(n);
      },
      delete() {
        const diffs = astom.removeNode(qpath, ast);
        if (ss) cssom.renderDiffs(diffs, ss);
        reset();
      },
      updateDocument,
      _ast: ast,
      // _ss: ss,
    };
  };
}
