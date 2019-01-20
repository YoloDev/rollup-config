import { Awaitable, ConfigType, createPipe } from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  isPackageContext,
  isProjectContext,
  withProject,
} from './context';

import { NameFactory } from '@yolodev/rollup-config-utils';
import Project from '@lerna/project';
import { collect } from './collect';

export const createPackagePipe = (
  nameFactory: NameFactory,
  fn: (
    commandOptions: any,
    inner: ConfigType,
    context: IPackageConfigContext,
  ) => Awaitable<ConfigType>,
) =>
  createPipe(nameFactory, async (cmdOpts, inner, context) => {
    let projectContext: IProjectConfigContext;

    if (!isProjectContext(context)) {
      const project = new Project();
      projectContext = withProject(context, project);
    } else {
      projectContext = context;
    }

    if (!isPackageContext(context)) {
      return await collect(cmdOpts, inner, projectContext, fn);
    }

    return await fn(cmdOpts, inner, context);
  });
