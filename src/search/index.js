import * as snabbdom from "snabbdom";
import h from "snabbdom/h";
import search from "./search";
import { getLibDocs } from "../code/parser";
// import svgPanZoom from "svg-pan-zoom";

const patch = snabbdom.init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/eventlisteners").default
]);

const MAX_RESULTS = 15;
let vnode;
let data;

const state = {
  searchResults: [],
  activeResult: undefined,
  clickedResults: []
};

function view(state) {
  return h("div#container", [search(render, state, data)]);
}

function render() {
  console.log(vnode);
  vnode = patch(vnode, view(state));
}

function init(_data) {
  data = _data;
  vnode = patch(document.getElementById("searchbox"), view(state));
}

getLibDocs("three").then(init);
