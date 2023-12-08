import type { CssInJs } from "postcss-js";

export function arrayToObject(arr: string[], finalValue: CssInJs = {}) {
  let obj: CssInJs = {};
  let temp = obj;

  for (let i = 0; i < arr.length; i++) {
    if (i === arr.length - 1) {
      temp[arr[i] as string] = finalValue;
    } else {
      temp[arr[i] as string] = {};
      temp = temp[arr[i] as string];
    }
  }

  return obj;
}
