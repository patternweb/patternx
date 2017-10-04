import graph from "./graph";

function log(object) {
  // console.log(JSON.stringify(object, null, 2))
  // console.log(object)
}

function doNothing(node) {}

function addFunction(node) {
  const object = {
    name: node.id.name,
    inports: node.params.map(p => [
      p.name,
      p.typeAnnotation ? p.typeAnnotation.typeAnnotation.type : "TSAnyKeyword"
    ]),
    outports: node.returnType
      ? node.returnType.typeAnnotation.type
      : "TSAnyKeyword"
  };
  log({ function: object });
  // graph.addComponent(object)
}

function addVariableDeclaration(node) {
  // log(node)
  const variable = node.declarations[0];
  log({
    VARIABLE: {
      name: variable.id.name,
      value: [variable.init.value, variable.init.type]
    }
  });
}

function addExpression(node) {
  const object = {
    name: node.callee.name, // function
    arguments: node.arguments.map(a => {
      // console.log(a)
      switch (a.type) {
        case "Literal":
        case "NumericLiteral":
          return a.value;
        case "Identifier":
          return a.name;
      }
    })
  };
  log({ EXPRESSION: object });
  graph.addProcess(object);
}

module.exports = {
  addFunction,
  addVariableDeclaration,
  addExpression,
  doNothing
};
