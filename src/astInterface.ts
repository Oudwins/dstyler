import * as postcss from "postcss-js";
import { Diff, diffProps } from "./astDiffer";

export type AST = ReturnType<typeof postcss.parse>;
export type ASTNodes = AST["nodes"];
export type ASTNode = ASTNodes extends (infer U)[] ? U : never;
export type atRuleQuery = { type: "atrule"; name: string; params: string };
export type ruleQuery = { type: "rule"; selector: string };
export type QueryItem = atRuleQuery | ruleQuery;
export type Query = QueryItem[];

export function walkQuery(
  query: Query,
  ast: AST,
  callback?: (curRoot: AST, step: QueryItem, idx: number) => number
) {
  let curRoot = ast;

  let idx = -1;
  for (const step of query) {
    switch (step.type) {
      case "atrule":
        if (step.name === "media") {
          //@ts-expect-error
          idx = curRoot.nodes.findLastIndex(
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
        idx = curRoot.nodes.findIndex(
          //@ts-expect-error
          (n) => n.selector === step.selector
        );
        break;
      default:
        throw new Error("Invalid query step type");
    }
    if (callback) {
      idx = callback(curRoot, step, idx);
    }

    if (idx < 0)
      throw new Error("Something wen't wrong walking query. Invalid index");
    //@ts-expect-error
    curRoot = curRoot.nodes[idx];
  }

  return curRoot;
}

export function getNode(query: Query, ast: AST) {
  return walkQuery(query, ast);
}

export function deleteNode(query: Query, ast: AST) {
  const path: number[] = [];
  const n = walkQuery(query, ast, (curRoot, step, idx) => {
    path.push(idx);
    return idx;
  });
  n.remove();
  return path;
}

export function setNode(query: Query, values: postcss.CssInJs, ast: AST) {
  const path: number[] = [];
  const n = walkQuery(query, ast, (curRoot, step, idx) => {
    if (idx < 0) {
      path.push(createNode(curRoot, step));
      return path[path.length - 1] as number;
    }
    return idx;
  });

  const diff: Diff[] = [];
  const nn = postcss.parse(values);
  if (query[query.length - 1]?.type === "rule") {
    diffProps(n.nodes, nn.nodes, diff);
  } else {
    diff.push({
      type: "raw",
      value: postcss
        .parse({
          [parseQueryTocssSelector(query[query.length - 1] as any)]: values,
        })
        .toString(),
    });
  }
  n.nodes = nn.nodes;

  return { path, diff };
}

export function parseQueryTocssSelector(queryItem: QueryItem) {
  if (queryItem.type === "rule") {
    return queryItem.selector;
  } else {
    return `@${queryItem.name} ${queryItem.params}`;
  }
}

// TODO find a way of doing this in a more efficient manner. Rather than iterating, if we find a node that doesn't exist we should just create the entire tree. Which means we need to convert our query into a js object and parse it with postcss?
export function createNode(curRoot: AST, step: QueryItem) {
  let node: postcss.CssInJs | null = null;
  let nIdx = 0;
  switch (step.type) {
    case "rule":
      node = {};
      node[step.selector] = {};

      // walk nodes backwards trying to find first non media query node
      for (let i = curRoot.nodes.length - 1; i >= 0; i--) {
        if ((curRoot.nodes[i] as any).name !== "media") {
          nIdx = i;
          break;
        }
      }
      if (!node) throw new Error("Failed at creating new node");
      const r1 = postcss.parse(node);
      curRoot.insertAfter(curRoot.nodes[nIdx] as any, r1.nodes);
      break;
    case "atrule":
      node = {};
      node[`@${step.name} ${step.params}`] = {};
      nIdx = curRoot.nodes.length;
      if (!node) throw new Error("Failed at creating new node");
      const r2 = postcss.parse(node);
      curRoot.append(r2.nodes);
      break;
  }
  return nIdx;
}

export default {
  getNode,
  deleteNode,
  setNode,
};
