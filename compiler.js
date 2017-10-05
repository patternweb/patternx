"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var ts = require("typescript");
function delint(sourceFile) {
    printAllChildren(sourceFile);
    function syntaxKindToName(kind) {
        return ts.SyntaxKind[kind];
    }
    function printAllChildren(node, depth) {
        if (depth === void 0) { depth = 0; }
        console.log(new Array(depth + 1).join('----'), syntaxKindToName(node.kind), node.pos, node.end);
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                // console.log(node)
                break;
        }
        depth++;
        node.getChildren().forEach(function (c) { return printAllChildren(c, depth); });
    }
}
exports.delint = delint;
var fileNames = process.argv.slice(2);
fileNames.forEach(function (fileName) {
    // Parse a file
    var sourceFile = ts.createSourceFile(fileName, fs_1.readFileSync(fileName).toString(), ts.ScriptTarget.ES2015, /*setParentNodes */ true);
    // delint it
    delint(sourceFile);
});
