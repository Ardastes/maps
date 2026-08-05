(function (global) {
  "use strict";

  function replaceLabels(value, labels) {
    if (typeof value !== "string") return value;
    return Object.keys(labels).reduce(function (text, source) {
      return text.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), global.i18n.t(labels[source]));
    }, value);
  }

  function localizePlotly(graph, config) {
    if (!graph || !global.Plotly || !config) return;
    var title = config.title && global.i18n.t(config.title);
    if (title && title !== config.title) global.Plotly.relayout(graph, { "title.text": title });

    (graph.data || []).forEach(function (trace, index) {
      if (!trace.hovertext || !config.hoverLabels) return;
      var localized = Array.isArray(trace.hovertext)
        ? trace.hovertext.map(function (text) { return replaceLabels(text, config.hoverLabels); })
        : replaceLabels(trace.hovertext, config.hoverLabels);
      global.Plotly.restyle(graph, { hovertext: localized }, [index]);
    });

    if (config.colorbarTitle) {
      global.Plotly.relayout(graph, { "coloraxis.colorbar.title.text": global.i18n.t(config.colorbarTitle) });
    }
  }

  global.localizePlotlyMaps = function (config) {
    function apply() {
      document.querySelectorAll(".plotly-graph-div").forEach(function (graph) {
        localizePlotly(graph, config);
      });
    }
    document.addEventListener("i18n:change", apply);
    apply();
  };
})(window);
