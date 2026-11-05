// Static site Worker: everything in ./site is served as-is.
// No server logic needed — the tracker runs entirely in the browser.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
