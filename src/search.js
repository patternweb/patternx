const svgPanZoom = require("svg-pan-zoom");
const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

import { fromEvent, skipRepeats, merge } from "most";

const search = document.getElementById("searchbox");
const preview = document.getElementById("preview");
const MAX_RESULTS = 15;

const state = {
  searchResults: [],
  clickedResults: []
};

function handleClick(event) {
  event.preventDefault();
  state.clickedResults.push(event.target.innerHTML);
  render();
  search.focus();
}

function render() {
  vnode = patch(vnode, view(state));
}

function view({ searchResults, clickedResults }) {
  return h("div", [
    h(
      "ul#results",
      state.searchResults.map(result =>
        h(
          "li",
          h(
            "a",
            { on: { click: handleClick }, attrs: { href: result } },
            result
          )
        )
      )
    ),
    h("ul#graph", state.clickedResults.map(result => h("li", result)))
  ]);
}

let vnode = patch(preview, view(state));

async function getLibDocs(libName) {
  const url = `libs/${libName}.json`;
  const response = await fetch(url);
  const body = await response.json();
  if (response.status === 200) return body;
  else throw Error(response.state);
}

const searchData = data => query =>
  data
    .filter(item => item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0)
    .map(item => item)
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    .slice(0, MAX_RESULTS);

function init(data) {
  const searchText = fromEvent("input", search)
    .map(e => e.target.value.trim())
    .skipRepeats()
    .multicast();

  const results = searchText
    .filter(text => text.length > 1)
    .debounce(20)
    .map(searchData(data));

  const emptyResults = searchText.filter(text => text.length < 1).constant([]);

  merge(results, emptyResults).observe(resultContent => {
    state.searchResults = resultContent.map(result => result.name);
    render();
  });
}

getLibDocs("three").then(init);
