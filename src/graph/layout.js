const dagre = require("dagre-layout");

function layout(graphData) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    // align: "TB",
    marginx: 150,
    marginy: 150,
    ranksep: 100,
    ranker: "longest-path",
    minlen: 2
  });
  g.setDefaultEdgeLabel(function() {
    return {};
  });
  for (const node of Object.keys(graphData.nodes)) {
    g.setNode(node, { width: 160, height: 60 });
  }
  for (const edge of graphData.edges) {
    // console.log(edge)
    g.setEdge(...edge);
  }
  dagre.layout(g);

  // g.nodes().forEach(function(v) {
  //   console.log("Node " + v + ": " + JSON.stringify(g.node(v)));
  // });
  // g.edges().forEach(function(e) {
  //   console.log(
  //     "Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(g.edge(e))
  //   );
  // });

  const nodes = g.nodes().reduce((ob, curr) => {
    ob[curr] = g.node(curr);
    return ob;
  }, {});

  const edges = g.edges().map(edge => {
    return g.edge(edge).points.map(({ x, y }) => [x, y]);
  });

  return {
    nodes,
    edges
  };
}

module.exports = {
  layout
};
