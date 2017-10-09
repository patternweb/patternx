import { init } from "snabbdom";
import h from "snabbdom/h";
import node from "./node";

const patch = init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/eventlisteners").default
]);

const graph = document.getElementById("graph");
let state = [];

let vnode = patch(graph, view(state));

function render() {
  vnode = patch(vnode, view(state));
}

function view(data) {
  return h("svg", { on: { dblclick: addNode } }, data.map(node.build));
}

function addNode(eventOrXYArray) {
  if (Array.isArray(eventOrXYArray)) {
    state.push(eventOrXYArray);
  } else {
    state.push([eventOrXYArray.clientX, eventOrXYArray.clientY]);
  }
  render();
}

window.graph = {
  addNode
};
