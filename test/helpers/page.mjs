// A stand-in for the browser globals theme-init.js and theme.js touch, so the real files run unchanged in node:vm.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const source = (file) => readFileSync(join(ROOT, file), "utf8");

/**
 * opts: stored (the localStorage value), storageThrows, systemDark, reduced, attrs (initial <html> attributes),
 * vt: "ok" (finishes once ready), "manual" (finishes when the test calls finishTransition), "skip", "throws", "none",
 * legacyMediaQuery (MediaQueryList with addListener only, as in Safari before 14).
 * As in a browser, the transition's update callback runs after startViewTransition returns, and an exception in an
 * event listener is reported (log.listenerErrors) without stopping the dispatch.
 */
export function fakePage(opts = {}) {
  const attrs = new Map(Object.entries(opts.attrs ?? {}));
  const classes = new Set();
  const props = new Map();
  const animations = [];
  const docListeners = new Map();
  const winListeners = new Map();
  const mqListeners = [];
  const raf = [];
  const store = new Map(opts.stored === undefined ? [] : [["cairn-theme", opts.stored]]);
  const log = { events: [], inUpdate: false, vtCalls: 0, listenerErrors: [], ready: false };
  const finishers = [];

  const root = {
    getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
    setAttribute: (k, v) => attrs.set(k, String(v)),
    style: { colorScheme: "", setProperty: (k, v) => props.set(k, v) },
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      contains: (c) => classes.has(c),
    },
    animate: (keyframes, options) => {
      animations.push({ keyframes, options, afterReady: log.ready });
      return {};
    },
  };
  const on = (map) => (type, fn) => map.set(type, [...(map.get(type) ?? []), fn]);
  const document = {
    documentElement: root,
    addEventListener: on(docListeners),
    removeEventListener: (type, fn) => docListeners.set(type, (docListeners.get(type) ?? []).filter((f) => f !== fn)),
    dispatchEvent: (e) => {
      log.events.push({ type: e.type, detail: e.detail, inUpdate: log.inUpdate });
      for (const fn of docListeners.get(e.type) ?? []) {
        try {
          fn(e);
        } catch (err) {
          log.listenerErrors.push(err);
        }
      }
      return true;
    },
  };
  const vt = opts.vt ?? "ok";
  if (vt !== "none") {
    document.startViewTransition = (update) => {
      log.vtCalls++;
      if (vt === "throws") throw new Error("InvalidStateError");
      log.ready = false;
      const updateCallbackDone = Promise.resolve().then(() => {
        log.inUpdate = true;
        try {
          update();
        } finally {
          log.inUpdate = false;
        }
      });
      const ready =
        vt === "skip"
          ? updateCallbackDone.then(() => {
              throw new Error("AbortError: skipped");
            })
          : updateCallbackDone;
      // Attached before the caller's await, so it runs first: an animation recorded with afterReady false began
      // before the pseudo-elements existed.
      ready.then(() => {
        log.ready = true;
      }, () => undefined);
      let finished = ready;
      if (vt === "manual") finished = ready.then(() => new Promise((done) => finishers.push(done)));
      ready.catch(() => undefined);
      finished.catch(() => undefined);
      return { ready, finished, updateCallbackDone };
    };
  }
  const localStorage = {
    getItem: (k) => {
      if (opts.storageThrows) throw new Error("SecurityError");
      return store.has(k) ? store.get(k) : null;
    },
    setItem: (k, v) => {
      if (opts.storageThrows) throw new Error("SecurityError");
      store.set(k, String(v));
    },
    removeItem: (k) => {
      if (opts.storageThrows) throw new Error("SecurityError");
      store.delete(k);
    },
  };
  const state = { systemDark: !!opts.systemDark, reduced: !!opts.reduced };
  const window = {
    localStorage,
    innerWidth: 1000,
    innerHeight: 800,
    matchMedia: (q) => ({
      matches: q.includes("color-scheme: dark") ? state.systemDark : q.includes("reduced-motion: reduce") ? state.reduced : false,
      ...(opts.legacyMediaQuery ? { addListener: (fn) => mqListeners.push(fn) } : { addEventListener: (_t, fn) => mqListeners.push(fn) }),
    }),
    requestAnimationFrame: (fn) => raf.push(fn),
    addEventListener: on(winListeners),
  };
  class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  }
  const context = vm.createContext({ window, document, CustomEvent });
  const run = (file) => vm.runInContext(source(file), context, { filename: file });
  return {
    run,
    window,
    root,
    attrs,
    classes,
    props,
    animations,
    store,
    log,
    state,
    flushRaf: () => raf.splice(0).forEach((fn) => fn()),
    /** Ends the oldest running "manual" transition. */
    finishTransition: () => finishers.shift()?.(),
    /** Lets queued promise callbacks run (the update callback, ready). */
    settle: () => new Promise((r) => setImmediate(r)),
    systemChange: (dark) => {
      state.systemDark = dark;
      for (const fn of mqListeners) fn();
    },
    storageEvent: (key, newValue) => {
      for (const fn of winListeners.get("storage") ?? []) fn({ key, newValue });
    },
  };
}
