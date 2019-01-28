import { Plugin, RollupWatchOptions } from 'rollup';

import { mapObj } from './map-obj';
import { mapOptions } from './map-config';
import { toArray } from './to-array';

export const addPlugins = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  plugins: Plugin | ReadonlyArray<Plugin>,
  condition: (options: RollupWatchOptions) => boolean = () => true,
) =>
  mapOptions(
    confs,
    options =>
      mapObj(
        { plugins: void 0, ...options },
        {
          plugins: (existing: Array<Plugin> | undefined) => {
            if (typeof existing === 'undefined') {
              return [...toArray(plugins)];
            }

            return [...existing, ...toArray(plugins)];
          },
        },
      ),
    condition,
  );
