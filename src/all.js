import { init } from "snabbdom";
import h from "snabbdom/h";
import graph from "./graph/graph";
// import search from "./search";

const patch = init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/eventlisteners").default
]);

let state = {
  graph: [],
  search: {}
};

let vnode = patch(document.getElementById("container"), view(state));

function render() {
  vnode = patch(vnode, view(state));
}

function view(data) {
  return h("div#container", [
    // search(render, data.search),
    graph(render, data.graph)
  ]);
}
