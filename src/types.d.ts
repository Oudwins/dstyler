export type cssInJs = { [k: string]: any };

export interface DynamicStylesheet {
  media: (params: string) => this;
  selector: (cssSelector: string) => this;
  set: (values: cssInJs) => void;
  setForce: (values: cssInJs) => void;
  add: (values: cssInJs) => void;
  delete: () => void;
  get: () => cssInJs;
  updateDocument: (doc: Document) => void;
  _ast: any;
  _ssInterface: any;
}

export type CreateDynamicStylesheet = (
  id: string,
  doc?: Document,
  initialState?: cssInJs
) => DynamicStylesheet;
