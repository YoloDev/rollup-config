import {
  IConfigContext,
  createChildContext,
} from '@yolodev/rollup-config-core';

const _delegationContext: unique symbol = Symbol.for(
  'rollup-config:delegation-context',
);
export interface IDelegatedConfigContext extends IConfigContext {
  readonly delegatedFrom: ReadonlyArray<string>;
  readonly [_delegationContext]: true;
}
export const withDelegations = (
  context: IConfigContext,
  delegatedFrom: ReadonlyArray<string>,
) =>
  createChildContext<IConfigContext, IDelegatedConfigContext>(context, {
    delegatedFrom,
    [_delegationContext]: true,
  });
export const isDelegatedContext = (
  ctx: IConfigContext,
): ctx is IDelegatedConfigContext => Boolean((ctx as any)[_delegationContext]);
