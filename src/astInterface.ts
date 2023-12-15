import * as postcss from "postcss-js";
import { Diff, astAddDiffer, astDiff } from "./astDiffer";
import { arrayToObject } from "./utils";
import { cssInJs } from "./types";

export type AST = ReturnType<typeof postcss.parse>;
export type ASTNodes = AST["nodes"];
export type ASTNode = ASTNodes extends (infer U)[] ? U : never;

export function queryWalker(
  path: string[],
  ast: AST,
  callback?: (v: {
    nodeIdx: number;
    step: string;
    stepIdx: number;
    curRoot: AST;
  }) => boolean
): any {
  const v = {
    nodeIdx: -1,
    step: "",
    stepIdx: -1,
    curRoot: ast,
  };
  for (const [i, step] of path.entries()) {
    v.step = step;
    v.stepIdx = i;
    if (step.startsWith("@")) {
      // at rule
      const spaceIdx = step.indexOf(" ");
      const atRule = step.substring(1, spaceIdx);
      const params = step.substring(spaceIdx + 1);

      // @media
      //@ts-expect-error
      v.nodeIdx = v.curRoot.nodes.findLastIndex(
        //@ts-expect-error
        (n) => {
          return n.name === atRule && n.params === params;
        }
      );
    } else {
      // selector
      v.nodeIdx = v.curRoot.nodes.findIndex(
        //@ts-expect-error
        (n) => n.selector === step
      );
    }

    if (callback) {
      if (callback(v)) {
        break;
      }
    }

    if (v.nodeIdx < 0)
      throw new Error(
        "Something wen't wrong walking query. Couldn't find node."
      );
    //@ts-expect-error
    v.curRoot = v.curRoot.nodes[v.nodeIdx];
  }

  return v.curRoot;
}

export function setNode(qpath: string[], values: postcss.CssInJs, ast: AST) {
  const path: number[] = [];
  const diff: Diff[] = [];
  const n = queryWalker(qpath, ast, (v) => {
    if (v.nodeIdx < 0) {
      // node does not exist
      const pn = arrayToObject(qpath.slice(v.stepIdx), values);
      // I have to parse the new node
      const parentNode: any = postcss.parse(pn).nodes[0];

      path.push(insertNode(v.curRoot, parentNode));
      // I have to create a raw diff
      diff.push({ type: "raw", path, value: parentNode.toString() });

      // stops walker
      return true;
    }
    path.push(v.nodeIdx);

    return false;
  });

  if (diff.length > 0) {
    return diff;
  }
  // handle case no created nodes in qpath. Only updated nodes for a node.
  // all nodes in qpath exist
  const nn = postcss.parse(values);
  // WARNING THIS IMPLEMENTATION WILL RESULT IN SS BEING OUT OF SYCH IF nn.nodes ARE IN DIFFERENT ORDER FROM n.nodes (in the case where they are not properties)
  // TODO fix this?
  astDiff(n.nodes, nn.nodes, path, diff);

  return diff;
}

export function getNode(qpath: string[], ast: AST) {
  const n = queryWalker(qpath, ast);

  return n;
}

export function removeNode(qpath: string[], ast: AST) {
  const path: number[] = [];

  const n = queryWalker(qpath, ast, (v) => {
    path.push(v.nodeIdx);
    return false;
  });

  n.remove();

  const diff: Diff[] = [{ type: "node", path, value: null }];
  return diff;
}

export function addToNode(qpath: string[], ast: AST, values: cssInJs) {
  // problem 1: I can't just append the nodes I have to check that they do not currently exist and not do anything if they exist. Because otherwise even for properties it will just append multiple duplicates
  const path: number[] = [];
  const diff: Diff[] = [];
  // 1. Find the node
  const n = queryWalker(qpath, ast, (v) => {
    if (v.nodeIdx < 0) {
      // node does not exist
      const pn = arrayToObject(qpath.slice(v.stepIdx), values);
      // I have to parse the new node
      const parentNode: any = postcss.parse(pn).nodes[0];

      path.push(insertNode(v.curRoot, parentNode));
      // I have to create a raw diff
      diff.push({ type: "raw", path, value: parentNode.toString() });
      // stops walker
      return true;
    }
    path.push(v.nodeIdx);

    return false;
  });
  if (diff.length > 0) {
    return diff;
  }
  astAddDiffer(n, values, path, diff);

  return diff;
}

// utils

export function insertNode(root: AST, node: any): number {
  if (root.nodes.length === 0 || node.name === "media") {
    root.append(node);
    return root.nodes.length - 1;
  } else {
    if (node?.type === "atrule") {
      // I have to insert it into the curRoot
      // TODO add support for non media atrules
      throw new Error("Only media queries currently supported");
    } else {
      // selector
      let siblingIdx = 0;
      for (let i = root.nodes.length - 1; i >= 0; i--) {
        if ((root.nodes[i] as any).name !== "media") {
          siblingIdx = i;
          break;
        }
      }
      root.insertAfter(root.nodes[siblingIdx] as any, node);
      return siblingIdx + 1;
    }
  }
}

export default {
  getNode,
  setNode,
  addToNode,
  removeNode,
};
