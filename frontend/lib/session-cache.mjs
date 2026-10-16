// Only the current session is shared, in memory and in this browser tab.
// Public pages can paint before the session check finishes.
export function createSessionCache({ maxAge = 15000, now = Date.now } = {}) {
  let snapshot;
  let expiresAt = 0;
  let pending = null;
  let version = 0;

  return {
    read(load) {
      if (snapshot && now() < expiresAt) return Promise.resolve(snapshot);
      if (pending) return pending;
      const requestVersion = version;
      const request = Promise.resolve().then(load).then((data) => {
        if (requestVersion === version) {
          snapshot = data;
          expiresAt = now() + maxAge;
        }
        return requestVersion === version ? data : (snapshot || { user: null });
      }).catch((error) => {
        if (requestVersion !== version) return snapshot || { user: null };
        throw error;
      }).finally(() => {
        if (pending === request) pending = null;
      });
      pending = request;
      return request;
    },
    write(data) {
      version += 1;
      snapshot = data;
      expiresAt = now() + maxAge;
      pending = null;
    },
    clear() {
      version += 1;
      snapshot = undefined;
      expiresAt = 0;
      pending = null;
    }
  };
}
