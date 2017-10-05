const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/class").default, // makes it easy to toggle classes
  require("snabbdom/modules/props").default, // for setting properties on DOM elements
  require("snabbdom/modules/style").default, // handles styling on elements with support for animations
  require("snabbdom/modules/eventlisteners").default // attaches event listeners
]);
const h = require("snabbdom/h").default;

const container = document.getElementById("graph");

let data = [];
let counter = 0;

let vnode = patch(container, view(data));

function addProcess(object) {
  // console.log(object);
  data = [
    ...data,
    h(
      "g",
      {
        attrs: {
          transform: `translate(${300},${Math.random() * 800})`,
          class: "process"
        }
      },
      [
        h("text", object.name),
        ...object.arguments.map((input, index) =>
          h(
            "text",
            { attrs: { x: -10, y: index * 20, "text-anchor": "end" } },
            input
          )
        )
      ]
    )
  ];
  render();
}

function addComponent(object) {
  data = [
    ...data,
    h(
      "text",
      { attrs: { y: Math.random() * 800, x: 100, class: "component" } },
      object.name
    )
  ];
  render();
  // data.functions.push(object)
  // console.log(data)
}

function render() {
  vnode = patch(vnode, view(data));
}

function view(newData) {
  // console.log(newData)
  return h(
    "svg",
    { attrs: { id: "graph", class: "panel", count: counter++ } },
    newData
  );
}

module.exports = {
  addComponent,
  addProcess
};
