const _context: unique symbol = Symbol.for('rollup-config:context');

export interface IConfigContext {
  readonly cwd: string;
  readonly commandOptions: any;
  readonly [_context]: true;
}

export const createContext = (commandOptions?: any): IConfigContext =>
  Object.freeze({
    cwd: process.cwd(),
    commandOptions,
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
