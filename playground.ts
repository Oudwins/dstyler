const dstyler: any = {};

const ds = dstyler.createDynamicStyleSheetHandler("id", "initialCSS", document);

ds.selector("id").add({}); //creates if not found
ds.selector("id").update({}); // creates if not found
ds.selector("id").delete();
ds.selector("id").get();
ds.media("id").selector("id").update({});

// invalid?
ds.media("id").add();
ds.selector("id");

ds.update({
  selectvor: ["mediaId", "selectorId"],
  values: {},
});

ds.update({
  media: {
    selector: {
      values: {},
    },
  },
});

dstyler.toJson(ds);
