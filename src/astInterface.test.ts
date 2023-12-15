import { beforeEach, describe, expect, it } from "vitest";
import {
  queryWalker,
  getNode,
  setNode,
  removeNode,
  addToNode,
  setNodeForce,
} from "./astInterface";
import * as postcss from "postcss-js";
import { vi } from "vitest";

function normalizeString(s: any) {
  return s.replaceAll(" ", "").replaceAll("\n", "");
}
describe("Query Walker", () => {
  const ast: any = postcss.parse({
    body: {
      background: "black",
    },
    "@media screen and (max-width: 300px)": {
      body: {
        background: "red",
      },
    },
  });

  it("Should return the final node in the query", () => {
    expect(
      queryWalker(["@media screen and (max-width: 300px)", "body"], ast)
    ).toBe(ast.nodes[1].nodes[0]);
  });
  it("Should stop if true is returned from callback", () => {
    const n = queryWalker(
      ["@media screen and (max-width: 300px)", "body"],
      ast,
      (v) => {
        if (v.step.startsWith("@")) {
          return false;
        }
        return true;
      }
    );

    expect(n).toBe(ast.nodes[1]);
  });
});

describe("Get Node", () => {
  const ast = postcss.parse({
    body: {
      background: "black",
    },
    "@media screen and (max-width: 300px)": {
      body: {
        background: "red",
      },
    },
  });

  it("Should return the queried node nested or not", () => {
    expect(getNode(["body"], ast)).toBe(ast.nodes[0]);
    expect(getNode(["@media screen and (max-width: 300px)", "body"], ast)).toBe(
      // @ts-ignore
      ast.nodes[1].nodes[0]
    );
  });
});

describe("Remove Node", () => {
  let ast: any = null;
  beforeEach(() => {
    ast = postcss.parse({
      body: {
        background: "black",
      },
      ".delete-me": {
        background: "red",
      },
      "@media screen and (max-width: 300px)": {
        body: {
          background: "red",
        },
      },
      "@media (max-width: 400px)": {
        body: {
          background: "red",
        },
      },
    });
  });
  it("Should delete a node in the ast & return a diff", () => {
    expect(ast.nodes[1].selector).toBe(".delete-me");
    const diff = removeNode([".delete-me"], ast);
    expect(ast.nodes[1].type).toBe("atrule");
    expect(diff).toEqual([{ type: "node", path: [1], value: null }]);
  });

  it("Should be able to remove nested nodes & return a diff", () => {
    expect(ast.nodes[2].nodes[0]).toBeDefined();
    const diff = removeNode(
      ["@media screen and (max-width: 300px)", "body"],
      ast
    );
    expect(ast.nodes[2].nodes[0]).toBeUndefined();
    expect(diff).toEqual([{ type: "node", path: [2, 0], value: null }]);
  });
  it("Should be able to remove media @rules", () => {
    expect(ast.nodes[2].params).toBe("screen and (max-width: 300px)");
    const diff = removeNode(["@media screen and (max-width: 300px)"], ast);
    expect(ast.nodes[2].params).toBe("(max-width: 400px)");
    expect(diff).toEqual([{ type: "node", path: [2], value: null }]);
  });
});

describe("Set Node", () => {
  let ast: any;
  beforeEach(() => {
    ast = postcss.parse({
      div: {
        background: "red",
        color: "red",
        "z-index": "10",
      },
      "@media (max-width: 300px)": {
        body: {
          background: "red ",
        },
      },
    });
  });

  it("Should Create Update and Delete style properties", () => {
    const diff = setNode(
      ["div"],
      { background: "blue", color: "red", margin: "10px" },
      ast
    );

    expect(diff).toEqual([
      {
        type: "properties",
        path: [0],
        value: {
          background: "blue",
          "z-index": null,
          margin: "10px",
        },
      },
    ]);
  });

  it("Should create new node/s if no node with selector exists", () => {
    const node = {
      ".myTest": {
        background: "blue",
      },
    };
    expect(ast.nodes[1].type).toBe("atrule");
    const diff = setNode([".myTest"], node[".myTest"], ast);
    expect(diff.length).toBe(1);
    expect(diff[0]?.type).toBe("raw");
    expect(diff[0]?.path).toEqual([1]);
    expect(normalizeString(diff[0]?.value)).toEqual(
      normalizeString(postcss.parse(node).toString())
    );
    expect(ast.nodes[1].selector).toBe(".myTest");
  });
  it("Should be able to create a new node even if tree is empty", () => {
    const ast = postcss.parse({});
    const newN = {
      ".test": {
        background: "red",
      },
    };
    const diff = setNode([".test"], newN[".test"], ast);
    expect(diff.length).toBe(1);
    expect(diff[0]?.type).toBe("raw");
    expect(diff[0]?.path).toEqual([0]);
    expect(normalizeString(diff[0]?.value)).toEqual(
      normalizeString(postcss.parse(newN).toString())
    );
  });
});

describe("Add to Node", () => {
  let ast: any;
  beforeEach(() => {
    ast = postcss.parse({
      div: {
        background: "red",
        "z-index": "10",
      },
      "@media (max-width: 300px)": {
        body: {
          background: "red ",
          "z-index": "10",
        },
      },
    });
  });

  it("Should create the node if it doesn't exist", () => {
    expect(ast.nodes[1].selector).toBeUndefined();
    const n = {
      body: {
        background: "red",
      },
    };
    const diff = addToNode([], n, ast);
    expect(ast.nodes[1].selector).toBe("body");
    expect(ast.nodes[1].nodes[0].prop).toBe("background");
    expect(ast.nodes[1].nodes[0].value).toBe("red");
    expect(diff[0]?.path).toEqual([1]);
    expect(normalizeString(diff[0]?.value)).toBe(
      normalizeString(postcss.parse(n).toString())
    );
  });

  it("Should return empty diff array if no changes needed", () => {
    const nodeOne = {
      div: {
        background: "red",
        "z-index": "10",
      },
    };
    const diff = addToNode([], nodeOne, ast);

    expect(diff).toEqual([]);
  });

  it("Should create and update properties on existing nodes & return correct diff", () => {
    const diff = addToNode(
      ["@media (max-width: 300px)", "body"],
      {
        background: "blue",
        color: "red",
        "z-index": "10",
      },
      ast
    );
    const obj = postcss.objectify(ast);
    expect(obj["@media (max-width: 300px)"]["body"]).toEqual({
      background: "blue",
      color: "red",
      zIndex: 10,
    });
    expect(diff[0]?.type).toBe("properties");
    expect(diff[0]?.value).toEqual({ background: "blue", color: "red" });
  });
  it("Should create and update properties on existing nodes & return correct diff - ON NESTED NODES iN VALUES", () => {
    const diff = addToNode(
      [],
      {
        "@media (max-width: 300px)": {
          body: {
            background: "blue",
          },
          div: {
            background: "red",
          },
        },
      },
      ast
    );
    // diffs
    expect(diff.length).toBe(2);
    expect(diff[0]?.value).toEqual({ background: "blue" });
    expect(normalizeString(diff[1]?.value)).toBe(
      normalizeString(postcss.parse({ div: { background: "red" } }).toString())
    );

    // ast status
    const obj = postcss.objectify(ast.nodes[1]);
    expect(obj["body"].background).toBe("blue");
    // didnt change
    expect(obj["body"].zIndex).toBeDefined();
    expect(obj["div"].background).toBe("red");
  });
});

describe("Set node with Force", () => {
  let ast: any;
  beforeEach(() => {
    ast = postcss.parse({
      div: {
        background: "red",
        color: "red",
        "z-index": "10",
      },
      "@media (max-width: 300px)": {
        body: {
          background: "red ",
        },
        ".test": {
          color: "red",
        },
      },
    });
  });

  it("Should replace the previous child nodes for a @rule and return a node diff", () => {
    const nodes = { div: { background: "red" } };

    const diff = setNodeForce(["@media (max-width: 300px)"], nodes, ast);

    // diff
    expect(diff[0]?.type).toBe("node");
    expect(diff[0]?.path).toEqual([1]);
    expect(normalizeString(diff[0]?.value)).toBe(
      normalizeString(
        postcss.parse({ "@media (max-width: 300px)": nodes }).toString()
      )
    );

    //
    expect(ast.nodes[1].nodes.length).toBe(1);
    expect(ast.nodes[1].nodes[0].selector).toBe("div");
    expect(postcss.objectify(ast.nodes[1].nodes[0])).toEqual(nodes.div);
  });
});
