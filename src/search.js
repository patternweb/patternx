const svgPanZoom = require("svg-pan-zoom");
const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/attributes").default,
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;
const _ = require("lodash");

import { fromEvent, skipRepeats, merge } from "most";

const search = document.getElementById("searchbox");
const preview = document.getElementById("preview");
const MAX_RESULTS = 15;

const state = {
  searchResults: [],
  activeResult: undefined,
  clickedResults: []
};

function handleClick(event) {
  event.preventDefault();
  state.clickedResults.push(event.target.innerHTML);
  render();
  search.focus();
}

function handleOver(event) {
  state.activeResult = event.target.innerHTML;
  render();
}

function handleOut(event) {
  // state.activeResult = undefined;
  render();
}

function render() {
  vnode = patch(vnode, view(state));
}

function buildNode(name) {
  const result = state.searchResults.find(res => res.name === name);
  const width = 500;
  if (result) {
    console.log(result);

    let position = 0;

    return h(
      "g.node",
      { attrs: { id: name, transform: `translate(50,100)` } },
      [
        h(
          "text.name",
          { attrs: { "text-anchor": "middle", x: width / 2 } },
          result.name
        ),
        ..._.flatMap(result.constructors, c =>
          h("g.inports", { y: { position } }, [
            // add inports for this constructor
            ..._.map(c.parameters, (p, index) => {
              position += 20;
              return h(
                "text",
                { attrs: { y: position } },
                `${p.name} <${p.type}>`
              );
            }),
            h("line", {
              attrs: {
                x1: 0,
                x2: width * 0.8,
                y1: (position += 10),
                y2: position
              }
            })
          ])
        ),
        h(
          "text.outport",
          {
            attrs: { y: 20, x: width }
          },
          result.constructors[0].returnType
        )
        // ..._.map(result.properties, (p, index) =>
        //   h(
        //     "text.outport",
        //     { attrs: { y: 20 * (index + 1), x: width, 'text-anchor': 'start' } },
        //     `${p.name} <${p.type}>`
        //   )
        // )
      ]
    );
  }
}

function view({ searchResults, clickedResults, activeResult }) {
  return h("div", [
    h(
      "ul#results",
      {
        attrs: { tabindex: 1 }
      },
      searchResults.map(result =>
        h("li", [
          h(
            "a",
            {
              on: {
                click: handleClick,
                mouseover: handleOver,
                mouseout: handleOut
              },
              attrs: { href: result }
            },
            result.name
          ),
          h("p", result.documentation)
        ])
      )
    ),
    h("ul#graph", clickedResults.map(result => h("li", result))),
    h("svg#svg", buildNode(activeResult))
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
    state.searchResults = resultContent;
    render();
  });
}

getLibDocs("three").then(init);
