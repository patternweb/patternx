import h from "snabbdom/h";
import node from "./node";

const addNode = (state, render) => eventOrXYArray => {
  if (Array.isArray(eventOrXYArray)) {
    state.push(eventOrXYArray);
  } else {
    state.push([eventOrXYArray.clientX, eventOrXYArray.clientY]);
  }
  console.log(state);
  render();
};

function Graph(render, state) {
  return h(
    "svg#graph",
    { on: { dblclick: addNode(state, render) } },
    state.map(node.build)
  );
}

// window.graph = {
//   graph,
//   addNode
// };

module.exports = Graph;
