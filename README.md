# Dstyler - Dynamic Stylesheets

Dstyler aims to provide a very simple and intuitive API to work with the little known Stylesheet browser API to create stylesheets that react to user input. Create, Remove, Update and Delete css styles,classes and media queries dynamically.

Dstyler should be particularly useful if you are creating a page builder or some other service where you want to allow a user to be able to access the full power of CSS.

Dstyler is "kind of" like the react of stylesheets. To avoid unnecesary dom updates we mantain a virtual cssom (powered by [postcss](https://github.com/postcss/postcss)) and only update it when necesary. Minimizing dom updates & screen rerenders.

## Getting Started

Install dstyler via [npm](https://www.npmjs.com/package/dstyler)

```bash
npm i dstyler
```

```js
import { createDynamicStylesheet, dsToJson } from "dstyler";

const initialState = {
  div: {
    background: "red",
  },
};

// create a new dynamic stylesheet
const ds = createDynamicStylesheet({
  id: "stylesheet id",
  doc: document,
  initialState,
});

ds.media("(min-width: 640px)")
  .selector(".my-mobile-class")
  .set({ background: "red" });
// The set function may be used to set nodes but this is not recomended as it may lead to unexpected  behaviour (you may break the stylesheet if not careful) -> ds.set({"div": {background: "red"}})
```

## A word of warning!

This is a very early library, the api's might change fast. I am currently working on adding a few more methods and react support.

## API

### CreateDynamicStylesheet

```js
// Creates a dynamic stylesheet instance
export type CreateDynamicStylesheet = ({
  id,
  doc,
  initialState,
}: {
  id: string; // unique stylesheet id
  doc: Document | null; // required to mount stylesheet & for styles to work on page
  initialState?: postcss.CssInJs; // initial state in postcss cssInJs format {".myclass": {background: "red"}}
}) => DynamicStylesheet;
```

### Dynamic Stylesheet

```js
export interface DynamicStylesheet {
  media: (params: string) => this;
  selector: (cssSelector: string) => this;
  set: (values: cssInJs) => void;
  setForce: (values: cssInJs) => void;
  add: (values: cssInJs) => void;
  delete: () => void;
  get: () => cssInJs;
  updateDocument: (doc: Document) => void; // set/update the document where the stylesheet is mounted
  _ast: any; // postcss AST
}
```

##### Method's explanation

**Selector methods**

```js
ds.media("media query params"); // (max-width: 300px), screen and (min-width:700px) ....

// !IMPORTANT. We assume this is unique on a per "block" basis -> ds.selector("div") always refers to the same css block while ds.media(id).selector('div') refers to a different node
ds.selector("css selector"); // .class, #id....
```

**Action methods**

Get: Returns a css in js object for the nodes selected;

```js
ds.selector("div").get(); // {div: {background: "red"}}
```

set(values): sets the node to the provided value
The set function may be used to set nodes but this is not recomended as it may lead to unsupported behaviours -> ds.set({"div": {background: "red"}})

```js
ds.selector("div").set({
  background: "red",
  color: "white",
  "font-size": "16px",
}); // css is created in global scope div {background: 'red'; color: "white"; font-size: "16px"}
ds.selector("div").set({ background: "blue", color: "white" }); // only background is changed to blue and font-sized removed so result is div {background: "blue"; color: "white"}
ds.selector("div").set({ background: "blue", color: "white" }); // css is not updated. "nothing" is done

ds.media("(max-width: 300px)").set({ div: { background: "red" } }); // NOT RECOMENDED. May lead to unexpected behaviour.
```

add(values): adds value to a node (creates if it doesn't exist, updates if it does)

```js
// div {background: 'blue'; color: 'red'}
ds.selector("div").add({ background: "red" }); // result -> div {background: 'red'; color: 'red'; }

// div {background: 'blue'; color: 'red'}
ds.selector("div").add({ background: "blue" }); // result -> no change

// @media (max-width: 300px) {.original {background: 'red';}}
ds.media("(max-width: 300px)").add({ div: { background: "red" } });
// result -> @media (max-width: 300px) {.original {background: 'red';} div: {background: 'red';}}

// Adding multiple "nodes" is supported
ds.media(m).add({ div: { backgrund: "red" }, body: { background: "blue" } }); //supported
```

delete(): delete a node and its child nodes

```js
ds.selector("div").delete(); // deletes div{background: "red"}
ds.media("(max-width: 300px)").delete(); //deletes media query & all nodes inside it!
```

**Opt out of diffing**
This can be dangerous if you do not know what you are doing. Be warned.

setForce(values): Set node to provided value
If node doesn't exist it will be created. If it exists, the entire node will be nuked and recreated.

```js
// @media (max-width: 300px) {div{background: "blue";} ...many more stuff...}
ds.media("(max-width: 300px)").setForce({ body: { background: "red" } });
// result -> @media (max-width: 300px) {body {background: "red"}}
```

### Mounting the Stylesheet on the DOM & Changing the mounted dom

ds.updateDocument(doc): this is specially useful for working with iframes and such. See my section on integration with react

```js
import { createDynamicStylesheet, dsToJson } from "dstyler";

const ds = createDynamicStylesheet({ id: "id", doc: document }); // stylesheet will be mounted on document automatically

const ds2 = createDynamicStylesheet({ id: "id" }); // stylesheet NOT MOUNTED, css NOT on page
ds2.selector(".myclass").set({ background: "red" });
ds2.updateDocument(document); // now stylesheet will be mounted with the .myclass class
```

### Storing and Recovering the css

```js
import { dsToJson, createDynamicStylesheet } from "dstyler";

const jsonCSS = dsToJson(ds); // returns a json string that can be stored anywhere. This json string is a postcss AST. You may use it with postcss to create a css file.

const ds2 = createDynamicStylesheet({
  id: "id",
  doc: document,
  initialState: JSON.parse(jsonCSS),
}); // restored css

const cssString = ds2._ast.toString(); // returns entire stylesheet as a css string
```

## Future improvements

- improve diffing algorithm to delete nodes if no children
- react compatibility?

## Thank You's & Maintenance

Big thank you to @prevwong the maintainer of [craftjs](https://github.com/prevwong/craft.js) for a conversation which led me to the idea for this library.

It is maintained by me @Oudwins as part of my work to develop a website builder for [Ridaly](https://ridaly.com/). Feel free contribute through the [github](https://github.com/Oudwins/dstyler), open an issue or a PR.

If you need to get in touch with me you can do so through [my site](https://tristanmayo.com/)
