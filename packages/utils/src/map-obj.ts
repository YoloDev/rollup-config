type ObjMapper<T> = { readonly [P in keyof T]?: (val: T[P]) => T[P] };

export const mapObj = <T>(obj: T, mapper: ObjMapper<T>): T => {
  let ret: T = {} as any;
  Object.keys(obj).forEach(_key => {
    const key: keyof T = _key as any;
    const map = mapper[key];
    if (map) {
      ret[key] = map(obj[key]);
    } else {
      ret[key] = obj[key];
    }
  });

  return ret;
};
