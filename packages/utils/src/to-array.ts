export const toArray = <T>(
  v: T,
): T extends ReadonlyArray<infer K> ? T : Array<T> => {
  if (Array.isArray(v)) {
    return v as any;
  } else {
    return [v] as any;
  }
};
