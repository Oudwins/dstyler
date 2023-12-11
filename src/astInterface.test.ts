import { beforeEach, describe, expect, it } from "vitest";
import { queryWalker, getNode, setNode, removeNode } from "./astInterface";
import * as postcss from "postcss-js";
import { vi } from "vitest";

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

function normalizeString(s: any) {
  return s.replaceAll(" ", "").replaceAll("\n", "");
}
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
    const diff = setNode([".myTest"], node[".myTest"], ast);
    expect(diff[0]?.type).toBe("raw");
    expect(diff[0]?.path).toEqual([1]);
    expect(normalizeString(diff[0]?.value)).toEqual(
      normalizeString(postcss.parse(node).toString())
    );
  });
});
