import { InputOption, OutputOptions, RollupWatchOptions } from 'rollup';

import Package from '@lerna/package';
import Project from '@lerna/project';
import { toArray } from './utils';

export type ConfigType = RollupWatchOptions | ReadonlyArray<RollupWatchOptions>;
export type Awaitable<T> = T | Promise<T>;

export async function* collectIter(
  project: Project,
  collector: (pkg: Package) => Awaitable<ConfigType>,
): AsyncIterableIterator<RollupWatchOptions> {
  for (const pkg of await project.getPackages()) {
    const confs = toArray(await collector(pkg));

    for (const conf of confs) {
      yield conf;
    }
  }
}

export const collect = async (
  project: Project,
  collector: (pkg: Package) => Awaitable<ConfigType>,
): Promise<ReadonlyArray<RollupWatchOptions>> => {
  const result = [];
  for await (const conf of collectIter(project, collector)) {
    result.push(conf);
  }

  return result;
};
