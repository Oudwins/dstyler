import * as postcss from "postcss-js";
import type { ASTNode, ASTNodes } from "./astInterface";
import type { AST } from "./astInterface";

export type DiffNode = { type: "node"; value: postcss.CssInJs | null };
export type DiffProperties = {
  type: "properties";
  value: { [k in string]: string | null };
};
export type DiffRaw = { type: "raw"; value: string };

export type Diff = DiffNode | DiffProperties | DiffRaw;

// See tests for examples.
// for node changes returns the rhs node (could update this to allow taking in undefined lhs & rhs)
// new node

export function diffRule(lhs: ASTNode, rhs: ASTNode) {
  const diff: Diff[] = [];
  if (lhs.type !== "rule" || rhs.type !== "rule")
    throw new Error("invalid node types passed to diff");

  // compare selector
  if (lhs.selector !== rhs.selector) {
    diff.push({
      type: "node",
      value: { [rhs.selector]: postcss.objectify(rhs as any) },
    });
    return diff;
  }

  diffProps(lhs.nodes, rhs.nodes, diff);

  return diff;
}

export function diffProps(lhs: any[], rhs: any[], diff: Diff[]) {
  let propsChanged = false;
  const properties: DiffProperties = { type: "properties", value: {} };

  // compare each dcl
  const maxLen = Math.max(lhs.length, rhs.length);
  for (let i = 0; i < maxLen; i++) {
    const rnode: any = rhs[i];
    const lnode: any = lhs[i];
    if (!rnode) {
      // removed
      properties.value[lnode.prop] = null;
      propsChanged = true;
    } else if (!lnode) {
      // created
      properties.value[rnode.prop] = rnode.value;
      propsChanged = true;
    } else if (lnode.prop !== rnode.prop) {
      // deleted & created
      properties.value[lnode.prop] = null;
      properties.value[rnode.prop] = rnode.value;
    } else if (lnode.value !== rnode.value) {
      // updated
      properties.value[rnode.prop] = rnode.value;
      propsChanged = true;
    }
  }

  if (propsChanged) {
    diff.push(properties);
  }

  return diff;
}

//This is naive implementation since we assume only one "branch" of changes (i.e that we cannot pass from:
// @media (max-width: 300px) { .myOldClass {} .myClass {}}
// @media (max-width: 300px) {.myNewClass{}}
// if there is a big difference between one node and the other we should probably just delete the current node and insert a new one. But that seems a little hard to implement.
// todo this is complicated
export function astDiff(
  lhs: AST | ASTNode | ASTNodes | undefined,
  rhs: AST | ASTNode | ASTNodes | undefined,
  result: Diff[]
) {
  if (!lhs && !rhs) {
    return result;
  }
  if (!lhs) {
    // created rhs
    result.push({ type: "node", value: postcss.objectify(rhs as any) });
    return result;
  }
  if (!rhs) {
    // deleted lhs
    result.push({ type: "node", value: null });
    return result;
  }

  if (Array.isArray(lhs) && Array.isArray(rhs)) {
    if (
      (lhs[0] && lhs[0].type === "decl") ||
      (rhs[0] && rhs[0].type === "decl")
    ) {
    }
    const max = Math.max(lhs.length, rhs.length);
    for (let i = 0; i < max; i++) {
      astDiff(lhs[i], rhs[i], result);
    }
  }
}
