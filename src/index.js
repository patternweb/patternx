import {
  doNothing,
  addFunction,
  addExpression,
  addVariableDeclaration
} from "./elements";
import { buildGraph } from "./graph";
import { parse } from "./code/parser";
import { createFiles } from "./files";
import { createGist } from "./github/create_gist";
import { loadGistCode } from "./github/load_gist";

const codeEditor = document.getElementById("code");

const params = new URLSearchParams(location.search);
const gistID = params.get("gist");
if (gistID) {
  loadGistCode(gistID)
    .catch(err => alert(err.message))
    .then(code => {
      codeEditor.value = code;
      buildGraph(parse(codeEditor.value));
    });
} else {
  codeEditor.value = `
// import * as THREE from "three";
// var scene = new THREE.Scene();
// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
// var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// var cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

// functions

function PointXYZ(xComponent?:number, yComponent?:number, zComponent?:number, system?:any):number {
  return 1;
}

function Move(geometry?:number, motion?:number):{ geometry:number, transform:number } {
  return { geometry, transform: motion};
}

function UnitX(factor?:number):number {
  return factor;
}

function Radians(degrees?:number):number {
  return degrees * Math.PI / 180;
}

function Rotate(geometry?:number, angle?:number, plane?:number):number {
  return geometry;
}

// nodes

const i = 4
const p = PointXYZ()
const x = UnitX(i)
Rotate(Move(p, x).geometry, Radians(60))
  `;
  buildGraph(parse(codeEditor.value));
}

function handleCodeKeyUp(event) {
  buildGraph(parse(codeEditor.value));
}

function handleSaveButtonClick(event) {
  console.log("saving...");
  createGist(createFiles(codeEditor.value))
    .then(gist => {
      console.log(gist);
      const params = new URLSearchParams(location.search);
      params.set("gist", gist.id);
      window.history.replaceState({}, "", `${location.pathname}?${params}`);
    })
    .catch(err => console.error(err.message));
}

codeEditor.addEventListener("keyup", handleCodeKeyUp);

document
  .getElementById("save-button")
  .addEventListener("click", handleSaveButtonClick);
