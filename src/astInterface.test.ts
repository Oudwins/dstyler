import { describe, expect, it } from "vitest";
import { walkQuery, getNode, deleteNode } from "./astInterface";
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
    const fn = vi.fn();
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
