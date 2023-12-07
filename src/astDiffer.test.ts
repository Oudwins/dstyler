import { beforeEach, describe, expect, it } from "vitest";
import { diffRule } from "./astDiffer";
import * as postcss from "postcss-js";

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
