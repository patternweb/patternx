import {readFileSync} from "fs";
import * as ts from "typescript";

export function delint(sourceFile: ts.SourceFile) {
  printAllChildren(sourceFile);

  function syntaxKindToName(kind: ts.SyntaxKind) {
    return (<any>ts).SyntaxKind[kind];
  }

  function printAllChildren(node: ts.Node, depth = 0) {
    console.log(new Array(depth+1).join('----'), syntaxKindToName(node.kind), node.pos, node.end);
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        // console.log(node)
        break;
    }
    depth++;
    node.getChildren().forEach(c=> printAllChildren(c, depth));
  }
}

const fileNames = process.argv.slice(2);
fileNames.forEach(fileName => {
  // Parse a file
  let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES2015, /*setParentNodes */ true);

  // delint it
  delint(sourceFile);
});