import { InputOption, OutputOptions, RollupWatchOptions } from 'rollup';

import { mapObj } from './map-obj';
import { mapOptions } from './map-config';
import path from 'path';

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

const fixConfigPaths = (
  conf: RollupWatchOptions,
  location: string,
): RollupWatchOptions => {
  return mapObj(conf, {
    input: mapInput(location),
    output: mapOutput(location),
  });
};

export const fixPaths = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  location: string,
): RollupWatchOptions | ReadonlyArray<RollupWatchOptions> =>
  mapOptions(confs, c => fixConfigPaths(c, location));
