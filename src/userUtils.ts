import { objectify } from "postcss-js";
import createDynamicStylesheet from "./createDynamicStylesheet";

export function dsToJson(ds: ReturnType<typeof createDynamicStylesheet>) {
  return objectify(ds._ast);
}
