const h = require("snabbdom/h").default;

function build([x, y]) {
  return h("circle", { attrs: { cx: x, cy: y, r: 10 } });
}

module.exports = {
  build
};
