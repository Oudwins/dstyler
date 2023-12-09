import { describe, expect, it } from "vitest";
import { astDiff } from "./astDiffer";
import * as postcss from "postcss-js";

function normalizeString(s: any) {
  return s.replaceAll(" ", "").replaceAll("\n", "");
}

describe("AST diff", () => {
  const lhsOq = {
    "@media (max-width: 300px)": {
      ".myclass": {
        background: "red",
        color: "red",
        "z-index": "1",
      },
      ".myclass2": {
        background: "red",
      },
    },
  };
  const lhsO = {
    ...lhsOq,
    body: {
      background: "red",
    },
    div: {
      background: "red",
    },
  };
  const lhs = postcss.parse(lhsO);

  it("Should return an empty array if no diff has been found", () => {
    const difres: any[] = [];
    const path: number[] = [];

    astDiff(lhs.first as any, lhs.first as any, path, difres);

    expect(difres).toEqual([]);
  });

  it("Should handle removal of a single node", () => {
    let rhsO = {
      "@media (max-width: 300px)": {
        ".myclass2": {
          background: "red",
        },
      },
      body: {
        background: "red",
      },
      div: {
        background: "red",
      },
    };
    let difres: any[] = [];
    // add a check for deleting nested nodes
    const path: number[] = [];
    let rhs = postcss.parse(rhsO);
    astDiff(lhs, rhs, path, difres);
    expect(difres).toEqual([{ type: "node", path: [0, 0], value: null }]);
  });

  it("Should handle creation of a single node", () => {
    const newNode = {
      ".myclass3": {
        background: "red",
      },
    };
    const rhsO = {
      "@media (max-width: 300px)": {
        ".myclass": {
          background: "red",
          color: "red",
          "z-index": "1",
        },
        ".myclass2": {
          background: "red",
        },
        ...newNode,
      },
      body: {
        background: "red",
      },
      div: {
        background: "red",
      },
    };
    let difres: any[] = [];
    // add a check for deleting nested nodes
    const path: number[] = [];
    let rhs = postcss.parse(rhsO);
    astDiff(lhs, rhs, path, difres);

    expect(difres[0].type).toEqual("node");
    expect(difres[0].path).toEqual([0, 2]);
    expect(normalizeString(difres[0].value)).toBe(
      normalizeString(postcss.parse(newNode).toString())
    );
  });

  it("Should handle removal of two nodes", () => {
    const difres: any[] = [];
    const path: any[] = [];
    const rhsO = { ...lhsO, body: undefined, div: undefined };
    astDiff(lhs, postcss.parse(rhsO), path, difres);
    expect(difres).toEqual([
      { type: "node", path: [1], value: null },
      { type: "node", path: [2], value: null },
    ]);
  });
  it("Should handle creation of two nodes", () => {
    const difres: any[] = [];
    const path: any[] = [];
    const newNode1 = {
      ".myclass1": { background: "red" },
    };
    const newNode2 = {
      ".myclass2": {
        background: "red",
      },
    };
    const rhsO = {
      ...lhsO,
      ...newNode1,
      ...newNode2,
    };
    astDiff(lhs, postcss.parse(rhsO), path, difres);
    expect(difres[0].type).toBe("node");
    expect(difres[0].path).toEqual([3]);
    expect(normalizeString(difres[0].value)).toBe(
      normalizeString(postcss.parse(newNode1).toString())
    );
    expect(difres[1].type).toBe("node");
    expect(difres[1].path).toEqual([4]);
    expect(normalizeString(difres[1].value)).toBe(
      normalizeString(postcss.parse(newNode2).toString())
    );
  });

  it("Should Handle the CRUD of node properties", () => {
    const difres: any[] = [];
    const path: any[] = [];
    const lhsO = {
      div: {
        background: "red",
        color: "blue",
        "font-size": "16px",
      },
    };
    const rhsO = {
      div: {
        background: "blue",
        "font-size": "16px",
        "z-index": "10",
      },
    };
    astDiff(postcss.parse(lhsO), postcss.parse(rhsO), path, difres);
    expect(difres).toEqual([
      {
        type: "properties",
        path: [0],
        value: {
          background: "blue",
          color: null,
          "z-index": "10",
        },
      },
    ]);
  });
});
