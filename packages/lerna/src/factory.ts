import {
  Awaitable,
  ConfigContext,
  ConfigError,
  ConfigType,
  FromPackageFactory,
  FromProjectFactory,
  FromRollupFactory,
  IConfigFactory,
  defaultContext,
  isConfigError,
} from './types';

import Package from '@lerna/package';
import Project from '@lerna/project';
import { collect } from './collect';

const _factory = Symbol.for('rollup:factory');

export const createFactory = (
  fromRollupFactory: FromRollupFactory,
  fromProjectFactory: FromProjectFactory,
  fromPackageFactory: FromPackageFactory,
) => {
  const factory = ((commandOptions?: any) =>
    fromRollupFactory(commandOptions)) as IConfigFactory;

  Object.defineProperties(factory, {
    fromProject: { value: fromProjectFactory },
    fromPackage: { value: fromPackageFactory },
    [_factory]: { value: true },
  });

  return factory;
};

export const fromPackage = (
  fromPackage: (
    context: ConfigContext,
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => Awaitable<ConfigType | ConfigError>,
): IConfigFactory => {
  const fromPackageFactory: FromPackageFactory = (
    context: ConfigContext,
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => fromPackage(context, project, pkg, commandOptions);

  const fromProjectFactory: FromProjectFactory = (
    context: ConfigContext,
    project: Project,
    commandOptions?: any,
  ) =>
    collect(context, project, (context, pkg) =>
      fromPackage(context, project, pkg, commandOptions),
    );

  const fromRollupFactory = async (commandOptions?: any) => {
    const result = await fromProjectFactory(
      defaultContext,
      new Project(),
      commandOptions,
    );

    if (isConfigError(result)) {
      throw result;
    }

    return result;
  };

  return createFactory(
    fromRollupFactory,
    fromProjectFactory,
    fromPackageFactory,
  );
};

export const isFactory = (fn: any): fn is IConfigFactory => {
  return Boolean(fn && fn[_factory]);
};
