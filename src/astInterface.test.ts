import { beforeEach, describe, expect, it } from "vitest";
import {
  walkQuery,
  getNode,
  deleteNode,
  setNode,
  createNode,
} from "./astInterface";
import * as postcss from "postcss-js";
import { vi } from "vitest";

describe("Walk Query", () => {
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

  it("Should throw an error for unknown/invalid query types", () => {
    expect(() => {
      //@ts-expect-error
      walkQuery([{ type: "test", selector: "body" }], ast);
    }).toThrow();
  });
  it("Should throw an error if given an invalid query path", () => {
    expect(() => {
      walkQuery(
        [
          {
            type: "atrule",
            name: "media",
            params: "screen and (max-width:350px)",
          },
          { type: "rule", selector: "body" },
        ],
        ast
      );
    }).toThrow();
  });

  it("Should return the final node in the query", () => {
    expect(walkQuery([{ type: "rule", selector: "body" }], ast)).toBe(
      ast.nodes[0]
    );
  });

  it("Should call the callback function on each layer with the right data", () => {
    const fn = vi.fn((a, b, idx) => idx);
    const step2 = {
      type: "rule",
      selector: "body",
    };

    walkQuery(
      [
        {
          type: "atrule",
          name: "media",
          params: "screen and (max-width: 300px)",
        },
        step2 as any,
      ],
      ast,
      fn
    );
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(ast.nodes[1], step2, 0);
  });

  it("Should override found/not found next index with index returned from callback", () => {
    expect(
      walkQuery(
        [
          {
            type: "atrule",
            name: "media",
            params: "screen and (max-width: 300px)",
          },
        ],
        ast,
        (ast, step, idx) => {
          const n = postcss.parse({ ".testing": {} });
          ast.append(n.nodes);
          return 2;
        }
      )
    ).toBe(ast.nodes[2]);
  });
});

describe("Create node", () => {
  const cssObj = {
    body: {
      background: "black",
    },
    "@media screen and (max-width: 300px)": {
      body: {
        background: "red",
      },
    },
  };
  let ast = postcss.parse(cssObj);

  beforeEach(() => {
    ast = postcss.parse(cssObj);
  });

  it("Should insert nodes just before media query nodes", () => {
    expect(ast.nodes[1]?.type === "atrule").toBe(true);

    createNode(ast, { type: "rule", selector: ".test" });

    expect(ast.nodes[1]?.type === "rule").toBe(true);
    expect((ast.nodes[1] as any).selector).toBe(".test");
  });

  it("Should insert nodes at the end inside a media query", () => {
    // @ts-ignore
    expect(ast.nodes[1].nodes[1]).toBeUndefined();
    createNode(ast.nodes[1] as any, { type: "rule", selector: ".testing" });
    // @ts-ignore
    expect(ast.nodes[1].nodes[1].selector).toBe(".testing");
  });
  it("Should insert media query nodes at the end", () => {
    //@ts-ignore
    expect(ast.nodes[2]).toBeUndefined();
    createNode(ast, {
      type: "atrule",
      name: "media",
      params: "(max-width: 400px)",
    });
    //@ts-ignore
    expect(ast.nodes[2].name).toBe("media");
    //@ts-ignore
    expect(ast.nodes[2].params).toBe("(max-width: 400px)");
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

  it("Should return the queried node", () => {
    expect(getNode([{ type: "rule", selector: "body" }], ast)).toBe(
      ast.nodes[0]
    );
  });
});

describe("delete node", () => {
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

describe("Set Node", () => {
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
    setNode(
      [
        {
          type: "atrule",
          name: "media",
          params: "screen and (max-width: 300px)",
        },
        { type: "rule", selector: "body" },
      ],
      { color: "red" },
      ast
    );

    const res = postcss.parse({ color: "red" });
    //@ts-expect-error
    expect(ast.nodes[0].nodes[0].nodes).toEqual(res.nodes);
  });

  it.skip("Should return the path and the diff if appropriate", () => {
    //
  });
});
