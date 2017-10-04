import * as babylon from "babylon";
import traverse from "babel-traverse";
import t from "babel-types";
import {
  doNothing,
  addFunction,
  addExpression,
  addVariableDeclaration
} from "./elements";

const codeEditor = document.getElementById("code");

codeEditor.value = `
// functions

function PointXYZ(xComponent:number, yComponent:number, zComponent:number, system:any):number {
  return 1;
}

function Move(geometry:number, motion:number):{ geometry:number, transform:number } {
  return geometry * motion;
}

function UnitX(factor:number):number {
  return factor;
}

function Radians(degrees:number):number {
  return degrees * Math.PI / 180;
}

function Rotate(geometry:number, angle:number, plane:number):number {
  return geometry;
}

// nodes

const i = 4
const p = PointXYZ()
const x = UnitX(60)
Rotate(Move(p, x), Radians(j))
`;
parseCode(codeEditor.value);

function parseCode(code) {
  const ast = babylon.parse(code, {
    sourceType: "module",
    plugins: ["typescript"]
  });
  traverse(ast, {
    enter(path) {
      let fn = doNothing;
      switch (path.node.type) {
        case "FunctionDeclaration":
          fn = addFunction;
          break;
        case "CallExpression":
          fn = addExpression;
          break;
        case "VariableDeclaration":
          fn = addVariableDeclaration;
          break;
      }
      fn(path.node);
    }
  });
}

function handleCodeKeyUp(event) {
  parseCode(event.target.value);
}

codeEditor.addEventListener("keyup", handleCodeKeyUp);
