export const _named = Symbol.for('rollup-config:named');

export const enum NameKind {
  Simple,
  Compact,
  Full,
}

export type NameFactory = (kind?: NameKind) => string;
export type Named = { readonly [_named]: NameFactory };
