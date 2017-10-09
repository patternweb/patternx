const h = require("snabbdom/h").default;

function build([x, y]) {
  return h(
    "g",
    {
      attrs: { transform: `translate(${x},${y})` }
    },
    h("circle", { attrs: { r: 10 } })
  );
}

module.exports = {
  build
};
