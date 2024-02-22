export const buildFacadeLayer = () => {
  const _facades = new WeakMap();

  const facades = {
    get(actual) {
      return actual == null ? actual : _facades.get(actual);
    },

    set(actual, facade) {
      if (_facades.has(actual) || actual === facade) {
        throw new Error('facade mappings must be 1:1');
      }

      _facades.set(actual, facade);
      _actuals.set(facade, actual);
    },
  };

  const _actuals = new WeakMap();

  const actuals = {
    get(facade) {
      return facade == null ? facade : _actuals.get(facade);
    },

    set(facade, actual) {
      if (_facades.has(actual) || _actuals.has(facade) || actual === facade) {
        throw new Error('facade mappings must be 1:1');
      }

      _facades.set(actual, facade);
      _actuals.set(facade, actual);
    },
  };

  return { facades, actuals };
};
