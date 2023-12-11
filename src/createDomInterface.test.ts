import { describe, it, expect, beforeEach } from "vitest";
import createDomInterface from "./createDomInterface";
import { JSDOM } from "jsdom";

describe("Diff Stylesheet processor: RAW inserts", () => {
  let ss: any = null;
  let processDiffs: any;
  beforeEach(() => {
    const { document: doc } = new JSDOM().window;
    const { ss: styles, processDiffs: diffs } = createDomInterface({
      id: "id",
      doc,
    });
    ss = styles;
    processDiffs = diffs;
  });
  it("Should insert css rules even if ss is empty", () => {
    const { document: doc } = new JSDOM().window;
    const { ss, processDiffs } = createDomInterface({ id: "id", doc });
    processDiffs([{ type: "raw", path: [0], value: "div{background: red}" }]);
    //@ts-expect-error
    expect(ss.cssRules[0].selectorText).toBe("div");
    //@ts-expect-error
    expect(ss.cssRules[0].style.background).toBe("red");
  });
  it("It should insert css rules in correct idx", () => {
    const { document: doc } = new JSDOM().window;
    const { ss, processDiffs } = createDomInterface({
      id: "id",
      initialCSS: "div {background: red;} @media (max-width: 300px) {}",
      doc,
    });
    processDiffs([
      { type: "raw", path: [1], value: "body {background: red;}" },
    ]);
    console.log(ss.cssRules);
    //@ts-expect-error
    expect(ss.cssRules[1].selectorText).toBe("body");
    //@ts-expect-error
    expect(ss.cssRules[1].style.background).toBe("red");
  });
});

describe("Diff Stylesheet processor: node diff", () => {
  it("Should delete the node if value is null", () => {
    const { document: doc } = new JSDOM().window;
    const { ss, processDiffs } = createDomInterface({
      id: "id",
      initialCSS: "div {background: red;} @media (max-width: 300px) {}",
      doc,
    });

    expect(ss.cssRules.length).toBe(2);
    processDiffs([{ type: "node", path: [0], value: null }]);
    expect(ss.cssRules.length).toBe(1);
    //@ts-expect-error
    expect(ss.cssRules[0].selectorText).toBeUndefined();
  });

  it("Should replace node at position if it exists", () => {
    const { document: doc } = new JSDOM().window;
    const { ss, processDiffs } = createDomInterface({
      id: "id",
      initialCSS: "div {background: red;} @media (max-width: 300px) {}",
      doc,
    });

    processDiffs([
      { type: "node", path: [0], value: "body {background: red;}" },
    ]);
    expect(ss.cssRules.length).toBe(2);
    //@ts-expect-error
    expect(ss.cssRules[0].selectorText).toBe("body");
  });
});

describe("Diff Stylesheet processor: properties diff", () => {
  it("Should update the properties of a node correctly, setting them to the new values or deleting them if property is null", () => {
    const { document: doc } = new JSDOM().window;
    const { ss, processDiffs } = createDomInterface({
      id: "id",
      initialCSS:
        "div {background: red; color: red;} @media (max-width: 300px) {}",
      doc,
    });

    processDiffs([
      {
        type: "properties",
        path: [0],
        value: {
          background: null,
          color: "blue",
          margin: "10px",
        },
      },
    ]);

    //@ts-expect-error
    expect(ss.cssRules[0].style.background).toBe("");
    //@ts-expect-error
    expect(ss.cssRules[0].style.color).toBe("blue");
    //@ts-expect-error
    expect(ss.cssRules[0].style.margin).toBe("10px");
  });
});
