import { objectify } from "postcss-js";
import type { DynamicStylesheet } from "./types";

export function dsToJson(ds: DynamicStylesheet) {
  return objectify(ds._ast);
}
