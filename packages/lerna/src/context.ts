import {
  IConfigContext,
  createChildContext,
} from '@yolodev/rollup-config-core';
import { Package, Project } from './types';

const _projectContext: unique symbol = Symbol.for(
  'rollup-config:project-context',
);
const _packageContext: unique symbol = Symbol.for(
  'rollup-config:package-context',
);

export interface IProjectConfigContext extends IConfigContext {
  readonly project: Project;
  readonly [_projectContext]: true;
}

export interface IPackageConfigContext extends IProjectConfigContext {
  readonly package: Package;
  readonly [_packageContext]: true;
}

export const withProject = (context: IConfigContext, project: Project) =>
  createChildContext<IConfigContext, IProjectConfigContext>(context, {
    project,
    [_projectContext]: true,
  });

export const withPackage = (context: IProjectConfigContext, pkg: Package) =>
  createChildContext<IProjectConfigContext, IPackageConfigContext>(context, {
    package: pkg,
    [_packageContext]: true,
  });

export const isProjectContext = (
  ctx: IConfigContext,
): ctx is IProjectConfigContext => Boolean((ctx as any)[_projectContext]);

export const isPackageContext = (
  ctx: IConfigContext,
): ctx is IPackageConfigContext => Boolean((ctx as any)[_packageContext]);
