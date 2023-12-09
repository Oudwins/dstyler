import { beforeEach, describe, expect, it } from "vitest";
import { queryWalker, getNode, deleteNode, setNode } from "./astInterface";
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

describe.skip("Get Node", () => {
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

  it("Should return the queried node", () => {
    expect(getNode([{ type: "rule", selector: "body" }], ast)).toBe(
      ast.nodes[0]
    );
  });
});

describe.skip("delete node", () => {
  // todo
  const ast = postcss.parse({
    body: {
      background: "black",
    },
    "@media screen and (max-width: 300px)": {
      body: {
        background: "red",
      },
    },
    ".delete-me": {
      background: "red",
    },
  });
  it("Should delete the node in the ast & return a path to the deleted node", () => {
    expect(ast.nodes[2]).toBeDefined();
    const path = deleteNode([{ type: "rule", selector: ".delete-me" }], ast);
    expect(ast.nodes[2]).toBeUndefined();
    expect(path).toEqual([2]);
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
