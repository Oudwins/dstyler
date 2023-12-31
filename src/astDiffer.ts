import { postcss } from ".";
import { AST, insertNode } from "./astInterface";
import { cssInJs } from "./types";

export type DiffNode = {
  type: "node";
  path: number[];
  value: string | null;
};

export type PropertiesObj = { [k in string]: string | null };
export type DiffProperties = {
  type: "properties";
  path: number[];
  value: PropertiesObj;
};
export type DiffRaw = { type: "raw"; path: number[]; value: string };

export type Diff = DiffNode | DiffProperties | DiffRaw;

// See tests for examples.

export function diffProps(
  lhs: any[],
  rhs: any[],
  path: number[],
  diff: Diff[]
) {
  let propsChanged = false;
  const properties: DiffProperties = {
    type: "properties",
    //@ts-ignore
    path: null,
    value: {},
  };

  const rhsProps: any = {};
  for (const prop of rhs) {
    rhsProps[prop.prop] = prop.value;
  }
  for (const prop of lhs) {
    if (!rhsProps[prop.prop]) {
      //deleted
      properties.value[prop.prop] = null;
      propsChanged = true;
      continue;
    }

    if (rhsProps[prop.prop] !== prop.value) {
      // updated
      properties.value[prop.prop] = rhsProps[prop.prop];
      propsChanged = true;
    } else {
      // no change
      delete rhsProps[prop.prop];
    }
  }
  for (const [prop, value] of Object.entries(rhsProps)) {
    // new created
    properties.value[prop as string] = value as string;
    propsChanged = true;
  }

  if (propsChanged) {
    properties.path = [...path];
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
  // lhs: AST | ASTNode | ASTNodes | undefined,
  // rhs: AST | ASTNode | ASTNodes | undefined,
  lhs: any,
  rhs: any,
  path: number[],
  result: Diff[]
) {
  if (!lhs && !rhs) {
    return result;
  }
  if (Array.isArray(lhs) && Array.isArray(rhs)) {
    if (
      (lhs[0] && lhs[0].type === "decl") ||
      (rhs[0] && rhs[0].type === "decl")
    ) {
      diffProps(lhs, rhs, path, result);
    } else {
      const rhsNodes: { [k: string]: number } = {};
      for (let i = 0; i < rhs.length; i++) {
        const key = rhs[i].selector || rhs[i].params;
        rhsNodes[key] = i;
      }
      for (let i = 0; i < lhs.length; i++) {
        const key: string = lhs[i].selector || lhs[i].params;
        if (key in rhsNodes) {
          // in both sides so recurse
          path.push(rhsNodes[key] as number);
          astDiff(lhs[i], rhs[rhsNodes[key] as number], path, result);
          path.pop();
          delete rhsNodes[key];
        } else {
          // delete
          result.push({ type: "node", path: [...path, i], value: null });
        }
      }
      for (const key in rhsNodes) {
        // these are new nodes all
        result.push({
          type: "node",
          path: [...path, rhsNodes[key] as number],
          value: rhs[rhsNodes[key] as number].toString(),
        });
      }
      // previos implementation
      // const max = Math.max(lhs.length, rhs.length);
      // for (let i = 0; i < max; i++) {
      // path.push(i);
      // astDiff(lhs[i], rhs[i], path, result);
      // path.pop();
      // }
    }

    return result;
  }

  if (!lhs) {
    // created rhs
    result.push({ type: "node", path: [...path], value: rhs?.toString() });
    return result;
  }
  if (!rhs) {
    // deleted lhs
    result.push({ type: "node", path: [...path], value: null });
    return result;
  }

  if (lhs.type !== rhs.type) {
    result.push({ type: "node", path: [...path], value: rhs.toString() });
    return result;
  }
  if (
    lhs.name !== rhs.name ||
    lhs.params !== rhs.params ||
    lhs.selector !== rhs.selector
  ) {
    result.push({ type: "node", path: [...path], value: rhs.toString() });
    return result;
  }

  astDiff(lhs.nodes, rhs.nodes, path, result);
}

export function astAddDiffer(
  n: any,
  values: cssInJs,
  path: number[],
  diff: Diff[]
) {
  if (n.type === "rule") {
    const properties: any = {};
    let update = false;
    const propDiff: PropertiesObj = {};
    n.nodes.forEach((el: any, idx: number) => {
      properties[el.prop as string] = { val: el.value, idx };
    });

    for (const [prop, val] of Object.entries(values)) {
      if (!properties[prop]) {
        update = true;
        propDiff[prop] = val;
        n.append(`${prop}: ${val};`);
      } else if (properties[prop].val !== val) {
        update = true;
        propDiff[prop] = val;
        n.nodes[properties[prop].idx].assign({ prop, value: val });
      }
    }
    if (update) {
      diff.push({ type: "properties", path: [...path], value: propDiff });
    }
  } else if (n.type === "atrule" || n.type === "root") {
    for (let i = 0; i < n.nodes.length; i++) {
      const selector = nodeToStringSelector(n.nodes[i]);

      if (selector in values) {
        const nVals = values[selector];
        delete values[selector];
        path.push(i);
        astAddDiffer(n.nodes[i], nVals, path, diff);
        path.pop();
      }
    }
    const newNodes = postcss.parse(values);

    for (let i = 0; i < newNodes.nodes.length; i++) {
      const str = newNodes.nodes[i]?.toString();
      const idx = insertNode(n, newNodes.nodes[i]);
      diff.push({
        type: "raw",
        path: [...path, idx],
        value: str as string,
      });
    }
  }
}

// utils

export function nodeToStringSelector(n: any) {
  switch (n.type) {
    case "atrule":
      return `@${n.name} ${n.params}`;
    case "rule":
      return n.selector;
    default:
      throw new Error("Invalid node type to translate to selector text");
  }
}
