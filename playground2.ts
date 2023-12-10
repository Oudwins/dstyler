import { JSDOM } from "jsdom";
// import createDynamicStylesheet from "./createDynamicStylesheet";
import * as postcss from "postcss-js";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
  </body>
</html>
`;
const { document } = new JSDOM(html).window;

// const ds = createDynamicStylesheet("id", undefined, document);

// ds.media("(max-width: 300px)").selector("body").set({ background: "red" });
// ds.media("(max-width: 300px)").selector("div").set({ background: "red" });

// console.log(postcss.objectify(ds._ast));
// console.log(ds._ast.nodes[0].nodes[1]);
