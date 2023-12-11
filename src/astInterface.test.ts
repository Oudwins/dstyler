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

describe.skip("Set Node", () => {
  let ast = postcss.parse({
    "@media screen and (max-width: 300px)": {
      body: {
        background: "red ",
      },
    },
  });

  beforeEach(() => {
    ast = postcss.parse({
      "@media screen and (max-width: 300px)": {
        body: {
          background: "red ",
        },
      },
    });
  });

  it("Should set the selected node's children to the value, replacing the previous values", () => {
    // setNode(
    //   [
    //     {
    //       type: "atrule",
    //       name: "media",
    //       params: "screen and (max-width: 300px)",
    //     },
    //     { type: "rule", selector: "body" },
    //   ],
    //   { color: "red" },
    //   ast
    // );
    // const res = postcss.parse({ color: "red" });
    // //@ts-expect-error
    // expect(ast.nodes[0].nodes[0].nodes).toEqual(res.nodes);
  });

  it.skip("Should return the path and the diff if appropriate", () => {
    //
  });
});
