If order matters

```js
const maxLen = Math.max(lhs.length, rhs.length);
for (let i = 0; i < maxLen; i++) {
  const rnode: any = rhs[i];
  const lnode: any = lhs[i];
  if (!rnode) {
    // removed
    properties.value[lnode.prop] = null;
    propsChanged = true;
  } else if (!lnode) {
    // created
    properties.value[rnode.prop] = rnode.value;
    propsChanged = true;
  } else if (lnode.prop !== rnode.prop) {
    // deleted & created
    properties.value[lnode.prop] = null;
    properties.value[rnode.prop] = rnode.value;
  } else if (lnode.value !== rnode.value) {
    // updated
    properties.value[rnode.prop] = rnode.value;
    propsChanged = true;
  }
}
```
