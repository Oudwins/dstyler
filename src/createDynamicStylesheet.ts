import * as postcss from "postcss-js";
import createDomInterface from "./createDomInterface";
import astInterface from "./astInterface";

export function createDynamicStyleSheetHandlerFactory(
  createSS: typeof createDomInterface,
  astUtils: typeof astInterface
): any {
  return function createDynamicStyleSheetHandler(
    id: string,
    initialState?: postcss.CssInJs,
    doc = document
  ) {
    // let query: Query = [];
    const ast = postcss.parse(initialState || {});
    const ss = createSS({
      id: id,
      doc: doc,
      initialCSS: initialState ? ast.toString() : undefined,
    });

    let qpath: string[] = [];
    return {
      media(rule: string) {
        const selector = "@media " + rule;
        qpath.push(selector);
        return this;
      },
      selector(s: string) {
        const selector = s;
        qpath.push(s);
        return this;
      },
      set(values: postcss.CssInJs) {
        const diffs = astInterface.setNode(qpath, values, ast);
        qpath = [];
        ss.processDiffs(diffs);
      },
      get() {
        const n = astInterface.getNode(qpath, ast);
        return postcss.objectify(n);
      },
      _ast: ast,
      _ssInterface: ss,
    };
  };
}
