// const dagre = require("dagre-layout");

// function layout(graph) {
//   const g = new dagre.graphlib.Graph();
//   g.setGraph({
//     rankdir: "LR",
//     // align: "TB",
//     marginx: 50,
//     marginy: 50,
//     ranksep: 100,
//     ranker: "longest-path",
//     minlen: 2
//   });
//   g.setDefaultEdgeLabel(function() {
//     return {};
//   });
//   const dag = {
//     nodes: Object.keys(graph.nodes()),
//     edges: Object.keys(graph.edges()).map(edge => {
//       const split = edge.split(">");
//       return [split[0], split[2]];
//     })
//   };
//   for (const node of dag.nodes) {
//     g.setNode(node, { width: 100, height: 60 });
//   }
//   for (const edge of dag.edges) {
//     // console.log(edge)
//     g.setEdge(...edge);
//   }
//   dagre.layout(g);

//   // g.nodes().forEach(function(v) {
//   //   console.log("Node " + v + ": " + JSON.stringify(g.node(v)));
//   // });
//   // g.edges().forEach(function(e) {
//   //   console.log("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(g.edge(e)));
//   // });

//   const nodes = g.nodes().reduce((ob, curr) => {
//     ob[curr] = g.node(curr);
//     return ob;
//   }, {});

//   const edges = g.edges().map(edge => {
//     return g.edge(edge).points.map(({ x, y }) => [x, y]);
//   });

//   return {
//     nodes,
//     edges
//   };
// }

// module.exports = {
//   layout
// };
