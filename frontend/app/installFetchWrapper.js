// Early client-side fetch wrapper: runs at module load time in the browser
if (typeof window !== "undefined") {
  (function install() {
    try {
      const globalAny = window;
      if (globalAny.__fetchWrapped) return;

      const origFetch = globalAny.fetch.bind(globalAny);

      globalAny.fetch = async (...args) => {
        try {
          const res = await origFetch(...args);
          return res;
        } catch (err) {
          // Network error or CORS failure — return synthetic 503 Response so callers get a Response object
          console.error('installFetchWrapper - network error:', err);
          try {
            return new Response(JSON.stringify({ message: 'Network error' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (e) {
            // If Response constructor not available, rethrow original error
            throw err;
          }
        }
      };

      globalAny.__fetchWrapped = true;
      console.log('[installFetchWrapper] Installed fetch wrapper');
    } catch (e) {
      console.error('[installFetchWrapper] failed to install', e);
    }
  })();
}
