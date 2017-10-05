const t = require("babel-types");
const babylon = require("babylon");
const walk = require("babylon-walk");

const keys = {
  TSNumberKeyword: "number",
  TSStringKeyword: "string"
};

const visitors = {
  // Statement(node, state, cont) {
  //   console.log(node)
  //   // if (t.isVariableDeclaration(node)) {
  //   //   for (const declarator of node.declarations) {
  //   //     // Continue walking the declarator
  //   //     state.variables.push(declarator.id.name)
  //   //     // console.log(declarator.id.name, declarator.init)
  //   //     // cont(declarator);
  //   //     walk.recursive(declarator.init, visitors, state);
  //   //   }
  //   // } else if (t.isFunctionDeclaration(node)) {
  //   //   state.components.push(node.id.name)
  //   // }
  // },

  FunctionDeclaration(node, state) {
    const inports = node.params.reduce((ob, param) => {
      const key = [param.name, param.optional ? "?" : ""].join("");
      ob[key] = keys[param.typeAnnotation.typeAnnotation.type] || "any";
      return ob;
    }, {});

    const component = {
      name: node.id.name,
      inports
    };

    if (keys[node.returnType.typeAnnotation.type]) {
      component.outport = keys[node.returnType.typeAnnotation.type];
    } else if (node.returnType.typeAnnotation.type === "TSTypeLiteral") {
      component.outports = node.returnType.typeAnnotation.members.reduce(
        (ob, key) => {
          ob[key.key.name] = keys[key.typeAnnotation.typeAnnotation.type];
          return ob;
        },
        {}
      );
    }

    state.components.push(component);
  },

  CallExpression(node, state) {
    // console.log(node.callee.name, node.arguments)
    const _process = {
      component: node.callee.name,
      name: `_${node.callee.name}0`
    };
    if (node.arguments.length > 0) {
      _process.inputs = node.arguments.reduce((obj, arg, index) => {
        const key = Object.keys(
          state.components.find(c => c.name === node.callee.name).inports
        )[index];
        if (t.isIdentifier(arg)) {
          obj[key] = `$${arg.name}`;
        } else if (t.isNumericLiteral(arg)) {
          obj[key] = arg.value;
        } else if (t.isMemberExpression(arg)) {
          obj[key] = `$_${arg.object.callee.name}0>${arg.property.name}`;
        } else if (t.isCallExpression(arg)) {
          obj[key] = `$_${arg.callee.name}0`;
        }
        // else { console.log(arg); obj[key] = arg.property }
        // else console.log(node.callee.name, arg.type)

        return obj;
      }, {});
    }
    state.processes.push(_process);

    for (const argument of node.arguments) {
      walk.recursive(argument, visitors, state);
    }
  },

  VariableDeclarator(node, state, cont) {
    if (t.isCallExpression(node.init)) {
      const _process = {
        component: node.init.callee.name,
        name: node.id.name
      };
      if (node.init.arguments.length > 0) {
        _process.inputs = node.init.arguments.reduce((obj, arg, index) => {
          const key = Object.keys(
            state.components.find(c => c.name === node.init.callee.name).inports
          )[index];
          if (t.isIdentifier(arg)) {
            obj[key] = `$${arg.name}`;
          }
          return obj;
        }, {});
      }
      state.processes.push(_process);
    }
    // cont(node.init)

    // cont(node);
    // console.log('-----------------')
    // for (const declarator of node.declarations) {
    // state.variables.push(declarator.id.name)
    // walk.recursive(declarator, visitors, state)
    // }
    // if (t.isFunction(node.init)) {
    //   state.variables.push(node.id.name)
    // }
  }
};

function parse(codeBlock) {
  const node = babylon.parse(codeBlock, {
    sourceType: "module",
    plugins: ["typescript"]
  });

  const state = {
    components: [],
    processes: []
    // variables: []
  };
  walk.recursive(node, visitors, state);
  return state;
}

module.exports = {
  parse
};
