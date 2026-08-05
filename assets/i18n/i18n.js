(function (global) {
  "use strict";

  var DEFAULT_LOCALE = "en";
  var STORAGE_KEY = "ardastes.maps.locale";
  var locales = global.I18N_LOCALES || {};
  var scriptUrl = document.currentScript && document.currentScript.src;
  var rootUrl = scriptUrl ? new URL("../../", scriptUrl).href : "./";
  var state = { locale: DEFAULT_LOCALE, namespaces: ["common"], messages: {} };
  var catalogCache = {};

  function normalizeLocale(locale) {
    if (!locale) return null;
    var normalized = String(locale).toLowerCase().replace("_", "-").split("-")[0];
    return locales[normalized] ? normalized : null;
  }

  function savedLocale() {
    try { return normalizeLocale(global.localStorage.getItem(STORAGE_KEY)); } catch (_) { return null; }
  }

  function browserLocale() {
    var candidates = global.navigator.languages || [global.navigator.language];
    for (var index = 0; index < candidates.length; index += 1) {
      var locale = normalizeLocale(candidates[index]);
      if (locale) return locale;
    }
    return null;
  }

  function preferredLocale() {
    return savedLocale() || browserLocale() || DEFAULT_LOCALE;
  }

  async function fetchMessages(locale, namespace) {
      var cacheKey = locale + "|" + namespace;
      if (catalogCache[cacheKey]) return catalogCache[cacheKey];
      // Cache the in-flight promise so concurrent requests deduplicate.
      var p = global.fetch(rootUrl + "lang/" + locale + "/" + namespace + ".json", { cache: "no-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("Unable to load " + locale + "/" + namespace);
          return response.json();
        })
        .then(function (json) {
          catalogCache[cacheKey] = json; // replace the promise with the resolved value for fast sync access
          return json;
        })
        .catch(function (err) {
          // On failure, remove the cache entry so future attempts can retry.
          if (catalogCache[cacheKey] === p) delete catalogCache[cacheKey];
          throw err;
        });
      catalogCache[cacheKey] = p;
      return p;
    }

  async function loadNamespace(locale, namespace) {
    var fallback = locale === DEFAULT_LOCALE ? {} : await fetchMessages(DEFAULT_LOCALE, namespace);
    try {
      var messages = await fetchMessages(locale, namespace);
      return Object.assign({}, fallback, messages);
    } catch (error) {
      if (locale === DEFAULT_LOCALE) throw error;
      console.warn("i18n fallback:", error);
      return fallback;
    }
  }

  async function load(locale, namespaces) {
    var dictionaries = await Promise.all(namespaces.map(function (namespace) {
      return loadNamespace(locale, namespace);
    }));
    return Object.assign.apply(Object, [{}].concat(dictionaries));
  }

  function translate(key, replacements) {
    var text = state.messages[key] || key;
    if (!replacements) return text;
    return text.replace(/{{\s*([\w.-]+)\s*}}/g, function (_, name) {
      return Object.prototype.hasOwnProperty.call(replacements, name) ? replacements[name] : _;
    });
  }

  function apply(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = translate(element.dataset.i18n);
    });
    (root || document).querySelectorAll("[data-i18n-attr]").forEach(function (element) {
      element.dataset.i18nAttr.split(",").forEach(function (entry) {
        var pair = entry.trim().split(":");
        if (pair.length === 2) element.setAttribute(pair[0].trim(), translate(pair[1].trim()));
      });
    });
  }

  async function activate(locale) {
    state.locale = normalizeLocale(locale) || DEFAULT_LOCALE;
    state.messages = await load(state.locale, state.namespaces);
    document.documentElement.lang = state.locale;
    apply();
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: { locale: state.locale, namespace: state.namespaces } }));
    return state.locale;
  }

  global.i18n = {
    init: async function (options) {
      options = options || {};
      if (options.baseUrl) rootUrl = options.baseUrl.replace(/\/?$/, "/");
      var namespace = options.namespace || "common";
      state.namespaces = Array.isArray(namespace) ? namespace : namespace === "common" ? ["common"] : ["common", namespace];
      return activate(options.locale || preferredLocale());
    },
    setLocale: async function (locale) {
      var selected = normalizeLocale(locale) || DEFAULT_LOCALE;
      try { global.localStorage.setItem(STORAGE_KEY, selected); } catch (_) { /* Storage can be unavailable. */ }
      return activate(selected);
    },
    getLocale: function () { return state.locale; },
    getLocales: function () { return locales; },
    t: translate,
    apply: apply
  };
  global.t = translate;
})(window);
