import * as postcss from "postcss-js";
import type { ASTNode } from "./astInterface";

export type DiffNewNode = { type: "node"; value: postcss.CssInJs };
export type DiffProperties = {
  type: "properties";
  value: { [k in string]: string | null };
};

export type Diff = DiffNewNode | DiffProperties;

// See tests for examples.
// for node changes returns the rhs node (could update this to allow taking in undefined lhs & rhs)
// new node

export function diffRule(lhs: ASTNode, rhs: ASTNode) {
  const diff = [];
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

  let propsChanged = false;
  const properties: DiffProperties = { type: "properties", value: {} };

  // compare each dcl
  const maxLen = Math.max(lhs.nodes.length, rhs.nodes.length);
  for (let i = 0; i < maxLen; i++) {
    const rnode: any = rhs.nodes[i];
    const lnode: any = lhs.nodes[i];
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
