import { ExternalOption, IsExternal, RollupWatchOptions } from 'rollup';

import { mapObj } from './map-obj';
import { mapOptions } from './map-config';

const createExternalFn = (external: ExternalOption): IsExternal => {
  if (Array.isArray(external)) {
    const set = new Set(external);
    return (id: string) => set.has(id);
  }

  return external;
};

export const addExternal = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  external: ExternalOption,
  condition: (options: RollupWatchOptions) => boolean = () => true,
) =>
  mapOptions(
    confs,
    options =>
      mapObj(
        { external: void 0, ...options },
        {
          external: (existing: ExternalOption | undefined) => {
            if (typeof existing === 'undefined') {
              return external;
            }

            if (Array.isArray(existing) && Array.isArray(external)) {
              return [...existing, ...external];
            }

            let first = createExternalFn(existing);
            let second = createExternalFn(external);
            return (id: string, parentId: string, isResolved: boolean) =>
              first(id, parentId, isResolved) ||
              second(id, parentId, isResolved);
          },
        },
      ),
    condition,
  );
