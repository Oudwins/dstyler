import { beforeEach, describe, expect, it } from "vitest";
import { astDiff, diffRule } from "./astDiffer";
import * as postcss from "postcss-js";

describe.skip("AST diff", () => {
  const lhsO = {
    "@media (max-width: 300px)": {
      ".myclass": {
        background: "red",
        color: "red",
        "z-index": "1",
      },
      div: {
        background: "red",
      },
      body: {
        background: "red",
      },
    },
  };
  const lhs = postcss.parse(lhsO);

  it.skip("Should return an empty array if no diff has been found", () => {
    const difres: any[] = [];

    astDiff(lhs.first as any, lhs.first as any, difres);

    expect(diffRule).toEqual([]);
  });

  it.skip("Should handle removal of a single node", () => {
    const rhsO = { ...lhsO, body: undefined };
    const difres: any[] = [];

    astDiff(lhs.first, postcss.parse(rhsO).first, difres);
    expect(difres).toEqual({ type: "node", path: [2], value: null });
  });

  it.skip("Should handle creation of a single node", () => {});

  it.skip("Should handle removal of two nodes", () => {
    const difres: any[] = [];
    const rhsO = { ...lhsO, body: undefined, div: undefined };
    astDiff(lhs.first, postcss.parse(rhsO).first, difres);
    expect(difres).toEqual([
      { type: "node", path: [1], value: null },
      { type: "node", path: [2], value: null },
    ]);
  });
});

describe("AST Diff Rule", () => {
  const lhsO = {
    ".myclass": {
      background: "red",
      color: "red",
      "z-index": "1",
    },
  };
  const lhs = postcss.parse(lhsO);

  it("Should return empty array if no differences", () => {
    expect(diffRule(lhs.first as any, lhs.first as any)).toEqual([]);
  });

  it("Should diff a new node correctly", () => {
    const rhsObj = {
      ".myClass2": {
        background: "red",
      },
    };
    const rhs = postcss.parse(rhsObj);

    expect(diffRule(lhs.first as any, rhs.first as any)).toEqual([
      {
        type: "node",
        value: rhsObj,
      },
    ]);
  });

  it("Should diff properties correctly", () => {
    const rhs = postcss.parse({
      ".myclass": {
        background: "blue",
        color: "red",
        "font-size": "16px",
      },
    });

    expect(diffRule(lhs.first as any, rhs.first as any)).toEqual([
      {
        type: "properties",
        value: {
          background: "blue",
          "z-index": null,
          "font-size": "16px",
        },
      },
    ]);
  });
});
