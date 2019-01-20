import { InputOption, OutputOptions, RollupWatchOptions } from 'rollup';

import { mapObj } from './map-obj';

const nonNull = <T>(v: T | null): v is T => v !== null;

export const mapOptions = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  mapper: (options: RollupWatchOptions) => RollupWatchOptions,
  condition: (options: RollupWatchOptions) => boolean = () => true,
): RollupWatchOptions | ReadonlyArray<RollupWatchOptions> =>
  Array.isArray(confs)
    ? confs.map(c => (condition(c) ? mapper(c) : c))
    : condition(confs as RollupWatchOptions)
    ? mapper(confs as RollupWatchOptions)
    : confs;

export const mapOutputs = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  mapper: (
    output: OutputOptions,
    options: RollupWatchOptions,
  ) => OutputOptions | null,
  condition: (options: RollupWatchOptions) => boolean = () => true,
) =>
  mapOptions(
    confs,
    conf =>
      mapObj(conf, {
        output: (output: OutputOptions | OutputOptions[] | undefined) => {
          if (typeof output === 'undefined') {
            return void 0;
          }

          if (Array.isArray(output)) {
            return output.map(output => mapper(output, conf)).filter(nonNull);
          }

          return mapper(output, conf) || void 0;
        },
      }),
    condition,
  );

export const mapInputs = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  mapper: (
    input: string,
    name: string | number,
    options: RollupWatchOptions,
  ) => string | null,
  condition: (options: RollupWatchOptions) => boolean = () => true,
) =>
  mapOptions(
    confs,
    conf =>
      mapObj(conf, {
        input: (input: InputOption) => {
          if (typeof input === 'string') {
            return mapper(input, 0, conf) || [];
          }

          if (Array.isArray(input)) {
            return input
              .map((input, index) => mapper(input, index, conf))
              .filter(nonNull);
          }

          return Object.keys(input).reduce((ret, name) => {
            const mapped = mapper(input[name], name, conf);
            if (mapped) {
              return { ...ret, [name]: mapped };
            }

            return ret;
          }, {});
        },
      }),
    condition,
  );
