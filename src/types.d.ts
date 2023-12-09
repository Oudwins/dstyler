export type cssInJs = { [k: string]: any };

export interface DynamicStylesheet {
  media: (params: string) => this;
  selector: (cssSelector: string) => this;
  set: (values: cssInJs) => void;
  _ast: any;
  _ssInterface: any;
}

export type CreateDynamicStylesheet = (
  id: string,
  initialState?: cssInJs,
  doc?: Document
) => DynamicStylesheet;
