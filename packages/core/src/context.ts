import { RollupConfigPipe } from './types';

const _context = Symbol.for('rollup-config:context');

export type StackFrame = RollupConfigPipe;

export interface IConfigContext {
  readonly cwd: string;
  readonly stack: ReadonlyArray<StackFrame>;
  readonly [_context]: true;
}

// TODO: Instead of Object.create, doing copying might be better for both create and createChild, but needs to include symbols

export const createContext = (): IConfigContext =>
  Object.freeze({
    cwd: process.cwd(),
    stack: Object.freeze([]),
    [_context]: true as true,
  });

type Diff<
  T extends string | number | symbol,
  U extends string | number | symbol
> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;
type Extension<TBase extends IConfigContext, TResult extends TBase> = Omit<
  TResult,
  keyof TBase
> &
  Partial<TResult>;

export const createChildContext = <
  TBase extends IConfigContext,
  TResult extends TBase
>(
  baseContext: TBase,
  modification: Extension<TBase, TResult>,
): Readonly<TResult> =>
  Object.freeze(
    Object.create(baseContext, Object.getOwnPropertyDescriptors(modification)),
  );

export const isContext = (o: any): o is IConfigContext =>
  Boolean(o && o[_context]);

export const withCwd = <T extends IConfigContext>(context: T, cwd: string): T =>
  createChildContext(context, { cwd } as Extension<T, T>);

export const addStackFrame = <T extends IConfigContext>(
  context: T,
  frame: StackFrame,
): T =>
  createChildContext(context, {
    stack: Object.freeze([...context.stack, frame]),
  } as Extension<T, T>);
