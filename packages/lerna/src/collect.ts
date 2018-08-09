import { InputOption, OutputOptions, RollupWatchOptions } from 'rollup';

import Package from '@lerna/package';
import Project from '@lerna/project';
import { mapObj } from './utils';
import path from 'path';

export type ConfigType = RollupWatchOptions | ReadonlyArray<RollupWatchOptions>;
export type Awaitable<T> = T | Promise<T>;

const toArray = <T>(
  v: T,
): T extends ReadonlyArray<infer K> ? T : ReadonlyArray<T> => {
  if (Array.isArray(v)) {
    return v as any;
  } else {
    return [v] as any;
  }
};

const mapInput = (location: string) => (input: InputOption): InputOption => {
  if (typeof input === 'string') {
    return path.resolve(location, input);
  }

  if (Array.isArray(input)) {
    return input.map(input => path.resolve(location, input));
  }

  return Object.keys(input).reduce(
    (ret, name) => ({ ...ret, [name]: path.resolve(location, input[name]) }),
    {},
  );
};

const mapOutput = (location: string) => (
  output: OutputOptions | OutputOptions[] | undefined,
): OutputOptions | OutputOptions[] | undefined => {
  if (typeof output === 'undefined') {
    return void 0;
  }

  if (Array.isArray(output)) {
    return output.map(mapOutput(location) as (
      output: OutputOptions,
    ) => OutputOptions);
  }

  return mapObj(output, {
    file: (name: string | undefined) =>
      typeof name === 'undefined' ? name : path.resolve(location, name),
  });
};

const fixPaths = (
  conf: RollupWatchOptions,
  location: string,
): RollupWatchOptions => {
  return mapObj(conf, {
    input: mapInput(location),
    output: mapOutput(location),
  });
};

export async function* collectIter(
  project: Project,
  collector: (pkg: Package) => Awaitable<ConfigType>,
): AsyncIterableIterator<RollupWatchOptions> {
  for (const pkg of await project.getPackages()) {
    const confs = toArray(await collector(pkg));

    for (const conf of confs) {
      yield fixPaths(conf, pkg.location);
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
