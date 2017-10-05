const svgPanZoom = require("svg-pan-zoom");
const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/attributes").default
  // require("snabbdom/modules/class").default, // makes it easy to toggle classes
  // require("snabbdom/modules/props").default, // for setting properties on DOM elements
  // require("snabbdom/modules/style").default, // handles styling on elements with support for animations
  // require("snabbdom/modules/eventlisteners").default // attaches event listeners
]);
const h = require("snabbdom/h").default;

const container = document.getElementById("graph");

let data = [];
let counter = 0;

let vnode = patch(container, view(data));

function addProcess(object) {
  // console.log(object);

  const width = 160;
  const height = 60;

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
        // h("circle.inport", { attrs: { cx: -width/2, cy: 0, r: 6 }}),
        h("circle.outport", { attrs: { cx: width / 2, cy: 0, r: 6 } }),
        h("rect", { attrs: { x: -width / 2, y: -height / 2, height, width } }),
        h("text.name", object.component)
        // h("text.component", object.component),
        // ...Object.keys(object.inputs).map((input, index) => {
        //   return h(
        //     "text.inport-name",
        //     { attrs: { x: -width / 2 + 5, y: index * 20 } },
        //     input
        //   );
        // })
      ]
    )
  ];
  render();
}

function addComponent(object) {
  // prettier-ignore
  data = [
    ...data,
    h("text", { attrs: { y: Math.random() * 800, x: 100, class: "component" } }, object.name)
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
  // prettier-ignore
  return h("svg", { attrs: { id: "graph", class: "panel", count: counter++ } }, newData);
}

function buildGraph(graphData) {
  graphData.processes.map(addProcess);

  const panZoom = svgPanZoom("svg", {
    zoomEnabled: true,
    panEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
    preventMouseEventsDefault: false,
    zoomScaleSensitivity: 0.3,
    dblClickZoomEnabled: false,
    maxZoom: 2,
    minZoom: 0.25
  });
}

module.exports = {
  addComponent,
  addProcess,
  buildGraph
};
