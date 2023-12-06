import { parse } from "postcss-js";

export type AST = ReturnType<typeof parse>;
export type atRuleQuery = { type: "atrule"; name: string; params: string };
export type ruleQuery = { type: "rule"; selector: string };
export type QueryItem = atRuleQuery | ruleQuery;
export type Query = QueryItem[];

const t = parse({});

export function walkQuery(
  query: Query,
  ast: AST,
  callback?: (curRoot: AST, step: QueryItem, foudIdx: number) => number
) {
  let curRoot = ast;

  let foundIdx,
    cbIdx = -1;
  for (const step of query) {
    switch (step.type) {
      case "atrule":
        if (step.name === "media") {
          //@ts-expect-error
          foundIdx = curRoot.nodes.findLastIndex(
            //@ts-expect-error
            (n) => {
              return n.name === step.name && n.params === step.params;
            }
          );
        } else {
          // TODO the rest of the atRule types
        }
        break;
      case "rule":
        foundIdx = curRoot.nodes.findIndex(
          //@ts-expect-error
          (n) => n.selector === step.selector
        );
        break;
      default:
        throw new Error("Invalid query step type");
    }
    if (callback) {
      cbIdx = callback(curRoot, step, foundIdx);
    }

    if (foundIdx < 0 && !cbIdx)
      throw new Error("Something wen't wrong walking query. Invalid index");
    //@ts-expect-error
    curRoot = cbIdx >= 0 ? curRoot.nodes[cbIdx] : curRoot.nodes[foundIdx];
  }

  return curRoot;
}

export function getNode(query: Query, ast: AST) {
  return walkQuery(query, ast);
}

export function deleteNode(query: Query, ast: AST) {
  const path: number[] = [];
  const n = walkQuery(query, ast, (curRoot, step, idx) => path.push(idx));
  n.remove();
  return path;
}

export default {
  getNode,
  deleteNode,
};
