import { NameFactory, NameKind, Named, _named } from './types';

import { indent } from './indent';

export const getName = (named: Named, kind?: NameKind) => named[_named](kind);
const _getName = (v: Named | string, kind?: NameKind) =>
  typeof v === 'string' ? v : getName(v, kind);

export const createNameFactory = (
  name: string,
  args: ReadonlyArray<string | Named>,
): NameFactory => (kind: NameKind = NameKind.Simple) => {
  if (kind === NameKind.Simple) {
    return name;
  }

  if (kind === NameKind.Compact) {
    return `${name}(${args.map(arg => _getName(arg, kind)).join(',')})`;
  }

  return [
    `${name}(`,
    ...args.map(arg => indent(_getName(arg, kind), 2)),
    ')',
  ].join('\n');
};

export const createNamed = (fn: NameFactory): Named =>
  Object.freeze({ [_named]: fn });
