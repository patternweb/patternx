import h from "snabbdom/h";
import _ from "lodash";
import { fromEvent, skipRepeats, merge } from "most";

const MAX_RESULTS = 15;

function Search(render, state, data) {
  return h("div", [
    h("input#search", {
      hook: {
        insert: init(data, state, render),
        remove: vnode => `removed ${vnode}`
      },
      attrs: {
        type: "text",
        autofocus: true,
        autocomplete: "off",
        placeholder: "Add a node...",
        tabIndex: 0
      }
    }),
    h(
      "ul#results",
      {
        attrs: { tabindex: 1 }
      },
      state.searchResults.map(result =>
        h("li", [
          h(
            "a",
            {
              on: {
                click: handleClick(state, render),
                mouseover: handleOver(state, render)
                // mouseout: handleOut(state, render),
              },
              attrs: { href: result }
            },
            result.name
          ),
          h("p", result.documentation)
        ])
      )
    ),
    h("ul#graph", state.clickedResults.map(result => h("li", result))),
    h("svg#svg", buildNode(state.activeResult, state))
  ]);
}

const handleClick = (state, render, elm) => event => {
  event.preventDefault();
  state.clickedResults.push(event.target.innerHTML);
  render();
  document.getElementById("search").focus();
};

const handleOver = (state, render) => event => {
  state.activeResult = event.target.innerHTML;
  render();
};

const handleOut = (state, render) => event => {
  state.activeResult = undefined;
  render();
};

function buildNode(name, state) {
  const result = state.searchResults.find(res => res.name === name);
  const width = 500;
  const height = 200;
  if (result) {
    // console.log(result);

    let position = 0;

    return h(
      "g.node",
      { attrs: { id: name, transform: `translate(50,100)` } },
      [
        h("rect", { attrs: { y: -20, width: width, height: height } }),
        h(
          "text.name",
          { attrs: { "text-anchor": "middle", x: width / 2 } },
          result.name
        ),
        ..._.flatMap(result.constructors, c =>
          h("g.inports", [
            // add inports for this constructor
            ..._.map(c.parameters, (p, index) => {
              position += 20;
              return h(
                "text",
                { attrs: { y: position, x: 5 } },
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
            attrs: { y: 20, x: width - 5 }
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

const searchData = data => query =>
  data
    .filter(item => item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0)
    .map(item => item)
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    .slice(0, MAX_RESULTS);

const init = (data, state, render) => vnode => {
  const searchText = fromEvent("input", vnode.elm)
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
    console.log(resultContent);
    render();
  });
};

module.exports = Search;
