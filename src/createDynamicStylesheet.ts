import * as postcss from "postcss-js";
import createDomInterface from "./createDomInterface";
import astInterface, { Query } from "./astInterface";

export default createDynamicStyleSheetHandlerFactory(
  createDomInterface,
  astInterface
);

export function createDynamicStyleSheetHandlerFactory(
  createSS: typeof createDomInterface,
  astUtils: typeof astInterface
) {
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
        // query.push({ type: "atrule", name: "media", params: rule });
        const selector = "@media " + rule;
        qpath.push(selector);
        return this;
      },
      selector(s: string) {
        // query.push({ type: "rule", selector: s });
        const selector = s;
        qpath.push(s);
        return this;
      },
      set(values: postcss.CssInJs) {
        // const { qpath, diff } = astInterface.setNode(query, values, ast);
        // ss.setNode(qpath, query, diff);
        // query = [];
        const diffs = astInterface.setNode(qpath, values, ast);
        qpath = [];
        ss.processDiffs(diffs);
      },
      _ast: ast,
      _ss: ss.ss,
    };
  };
}
