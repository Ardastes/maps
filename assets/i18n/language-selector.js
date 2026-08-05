(function (global) {
  "use strict";

  function createLanguageSelector(options) {
    options = options || {};
    if (!global.i18n) throw new Error("Load i18n.js before language-selector.js.");

    var locales = global.i18n.getLocales();
    var container = document.createElement("label");
    container.className = options.className || "i18n-language-selector";
    var text = document.createElement("span");
    var select = document.createElement("select");
    select.setAttribute("aria-label", global.i18n.t("select_language"));

    Object.keys(locales).forEach(function (code) {
      var option = document.createElement("option");
      option.value = code;
      option.textContent = locales[code].label;
      select.appendChild(option);
    });

    function refresh() {
      text.textContent = global.i18n.t("language");
      select.value = global.i18n.getLocale();
      select.setAttribute("aria-label", global.i18n.t("select_language"));
    }

    select.addEventListener("change", function () { global.i18n.setLocale(select.value); });
    document.addEventListener("i18n:change", refresh);
    container.append(text, select);
    (options.mount || document.body).appendChild(container);
    refresh();
    return container;
  }

  global.createLanguageSelector = createLanguageSelector;
})(window);
