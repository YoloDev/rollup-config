import {
  ConfigType,
  RollupConfigFunction,
  RollupConfigMiddleware,
  RollupConfigPipe,
  _middleware,
} from './types';
import { NameFactory, NameKind, _named } from '@yolodev/rollup-config-utils';
import { createPipe, empty, isConfigPipe } from './pipe';

const toPipe = (
  inner?: RollupConfigPipe | RollupConfigFunction | ConfigType,
) => {
  if (!inner) {
    return empty;
  }

  if (isConfigPipe(inner)) {
    return inner;
  }

  if (typeof inner === 'function') {
    return createPipe(() => '<user-pipe>', inner);
  }

  return createPipe(() => '<user-config>', () => inner);
};

export const createMiddleware = (
  nameFactory: NameFactory,
  fn: (inner: RollupConfigPipe) => RollupConfigPipe,
) => {
  const name = nameFactory(NameKind.Simple);
  const mw = (inner?: RollupConfigPipe | RollupConfigFunction | ConfigType) => {
    const innerPipe = toPipe(inner);

    return fn(innerPipe);
  };

  Object.defineProperties(mw, {
    [_middleware]: { value: true, configurable: false, enumerable: false },
    [_named]: { value: nameFactory, configurable: false, enumerable: false },
    name: { value: name, configurable: true, enumerable: false },
  });

  return mw as RollupConfigMiddleware;
};
