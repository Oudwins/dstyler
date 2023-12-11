# Dstyler - Dynamic Stylesheets

Small package for working with dynamic stylesheets powered by [postcss](https://github.com/postcss/postcss). Create, Remove, Update and Delete css styles dynamically.

Dstyler should be particularly useful if you are creating a page builder or some other service where you want to allow a user to be able to access the full power of CSS.

Dstyler is "kind of" like the react of stylesheets. To avoid unnecesary dom updates we mantain a virtual cssom and only update it when necesary. Minimizing dom updates & screen rerenders.

## Getting Started

Install dstyler

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
const ds = createDynamicStylesheet("stylesheet id", initialState, document);

ds.media("(min-width: 640px)")
  .selector(".my-mobile-class")
  .set({ background: "red" });
// The set function may be used to set nodes but this is not recomended as it may lead to unexpected  behaviour (you may break the stylesheet if not careful) -> ds.set({"div": {background: "red"}})
```

## A word of warning!

This is a very early library, the api's might change fast. I am currently working on adding a few more method and react support.

## API

### CreateDynamicStylesheet

```js
// Creates a dynamic stylesheet instance
export type CreateDynamicStylesheet = (
  id: string,
  initialState?: cssInJs,
  doc?: Document
) => DynamicStylesheet;
```

### Dynamic Stylesheet

```js
export interface DynamicStylesheet {
  media: (params: string) => this;
  selector: (cssSelector: string) => this;
  set: (values: cssInJs) => void;
  _ast: any;
  _ssInterface: any;
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

Set: sets the node to the provided value
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

Delete: delete a node and its child nodes

```js
ds.selector("div").delete(); // deletes div{background: "red"}
ds.media("(max-width: 300px)").delete(); //deletes media query & all nodes inside it!
```

### Storing and Recovering the css

```js
import { dsToJson, createDynamicStylesheet } from "dstyler";

const jsonCSS = dsToJson(ds); // returns a json string that can be stored anywhere. This json string is a postcss AST. You may use it with postcss to create a css file.

const ds = createDynamicStylesheet("id", JSON.parse(jsonCSS), document); // restored css

const cssString = ds._ast.toString(); // returns entire stylesheet as a css string
```

## Future improvements

- improve diffing algorithm to delete nodes if no children
- found bug, set is not working correctly on the stylesheet but yes on the ast & it doesn't work on ast to update it....
