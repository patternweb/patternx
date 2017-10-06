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
const { layout } = require("./layout");

let data = [];
let counter = 0;

let vnode = patch(container, view(data));

function addProcess(name, component, { width, height, x, y }) {
  console.log(component);
  data = [
    ...data,
    h(
      "g",
      {
        attrs: {
          transform: `translate(${x},${y})`,
          class: "process",
          id: name
        }
      },
      [
        // h("circle.inport", { attrs: { cx: -width/2, cy: 0, r: 6 }}),
        h("circle.outport", { attrs: { cx: width / 2, cy: 0, r: 6 } }),
        h("rect", { attrs: { x: -width / 2, y: -height / 2, height, width } }),
        h("text.component", component.name),
        h("text.name", { attrs: { y: 15 } }, name),

        ...Object.keys(component.inports).map((inport, index) => {
          return h(
            "text.inport-name",
            { attrs: { x: -width / 2 - 3, y: index * 20 - height / 4 } },
            inport
          );
        })
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
  const vGraph = graphData.processes.reduce(
    (obj, proc) => {
      obj.nodes[proc.name] = proc.component;
      const edges = Object.keys(proc.inputs || {})
        .filter(key => proc.inputs[key][0] === "$")
        .map(key => {
          return [proc.inputs[key].slice(1).split(">")[0], proc.name];
        });
      obj.edges = obj.edges.concat(edges);
      return obj;
    },
    { nodes: { i: "Move" }, edges: [] }
  );

  // console.log(graphData)
  // console.log(vGraph)

  const positionedGraph = layout(vGraph);

  for (const key of Object.keys(vGraph.nodes)) {
    addProcess(
      key,
      graphData.components.find(c => c.name === vGraph.nodes[key]),
      positionedGraph.nodes[key]
    );
  }

  const panZoom = svgPanZoom("svg", {
    zoomEnabled: true,
    panEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: false,
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
