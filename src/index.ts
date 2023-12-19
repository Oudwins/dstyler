export * as postcss from "postcss-js";
export * from "./userUtils";
import { createDynamicStyleSheetHandlerFactory } from "./createDynamicStylesheet";
import createDomInterface from "./cssom";
import astInterface from "./astInterface";
import type { CreateDynamicStylesheet } from "./types";

export const createDynamicStylesheet: CreateDynamicStylesheet =
  createDynamicStyleSheetHandlerFactory(createDomInterface, astInterface);
