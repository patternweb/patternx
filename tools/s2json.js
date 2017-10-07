"use strict";
exports.__esModule = true;
var ts = require("typescript");
var fs = require("fs");
var path = require('path');
;
var program;
var checker;
function generate(filePaths, options) {
    var fullFilePaths = filePaths.map(function (name) { return "node_modules/@types/" + name + "/index.d.ts"; });
    program = ts.createProgram(fullFilePaths, options);
    checker = program.getTypeChecker();
    var files = program.getSourceFiles();
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        // only document files we specified. dependency files may be in program
        // if (filePaths.indexOf(sourceFile.fileName) >= 0) {
        if (sourceFile.fileName === 'node_modules/@types/three/index.d.ts') {
            var name_1 = path.basename(sourceFile.fileName, '.d.ts');
            console.log('Processing:', sourceFile.fileName);
            var fd = {
                name: name_1,
                kind: 'file',
                members: {}
            };
            doc.members[name_1] = fd;
            push(fd);
            ts.forEachChild(sourceFile, visit);
        }
    }
    fs.writeFileSync("public/libs/lodash.json", JSON.stringify(doc, undefined, 2));
    return doc;
}
exports.generate = generate;
var inClass = false;
function visit(node) {
    if (node.kind == ts.SyntaxKind.ClassDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }
        var cd = node;
        var symbol = checker.getSymbolAtLocation(cd.name);
        if (symbol) {
            var doc_1 = getDocEntryFromSymbol(symbol);
            doc_1.kind = 'class';
            if (inClass) {
                pop();
            }
            inClass = true;
            var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            doc_1.constructors = constructorType.getConstructSignatures().map(getDocEntryFromSignature);
            current.members[doc_1.name] = doc_1;
            push(doc_1);
        }
    }
    else if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }
        var id = node;
        var symbol = checker.getSymbolAtLocation(id.name);
        if (symbol) {
            var doc_2 = getDocEntryFromSymbol(symbol);
            doc_2.kind = 'interface';
            if (inClass) {
                pop();
            }
            inClass = true;
            var types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            var st = symbol.members;
            for (var memberName in st) {
                var s = st[memberName];
                var memberDeclarations = s.getDeclarations();
                if (memberDeclarations.length > 0) {
                    var memberDoc = {};
                    memberDoc.documentation = ts.displayPartsToString(s.getDocumentationComment());
                    memberDoc.name = memberName;
                    memberDoc["return"] = checker.typeToString(checker.getTypeAtLocation(memberDeclarations[0]));
                    doc_2.members[memberName] = memberDoc;
                }
            }
            current.members[doc_2.name] = doc_2;
            push(doc_2);
        }
    }
    if (node.kind == ts.SyntaxKind.EndOfFileToken) {
        inClass = false;
        current = doc;
    }
    else if (node.kind == ts.SyntaxKind.MethodDeclaration) {
        var m = node;
        var symbol = checker.getSymbolAtLocation(m.name);
        if (symbol) {
            var doc_3 = getDocEntryFromSymbol(symbol);
            doc_3.kind = 'method';
            doc_3.name = symbol.getName();
            var types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            var sigs = types.getCallSignatures();
            doc_3.signatures = sigs.map(getDocEntryFromSignature);
            current.members[doc_3.name] = doc_3;
        }
    }
    else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }
        var f = node;
        if (inClass) {
            pop();
        }
        inClass = false;
        var symbol = checker.getSymbolAtLocation(f.name);
        if (symbol) {
            var doc_4 = getDocEntryFromSymbol(symbol);
            doc_4.kind = 'function';
            doc_4.name = symbol.getName();
            var types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            var sigs = types.getCallSignatures();
            doc_4.signatures = sigs.map(getDocEntryFromSignature);
            current.members[doc_4.name] = doc_4;
        }
    }
    else if (node.kind === ts.SyntaxKind.VariableStatement && node.flags === ts.NodeFlags.Export) {
        var statement = node;
        var list = statement.declarationList;
        for (var _i = 0, _a = list.declarations; _i < _a.length; _i++) {
            var declaration = _a[_i];
            var symbol = checker.getSymbolAtLocation(declaration.name);
            var doc_5 = getDocEntryFromSymbol(symbol);
            doc_5.kind = 'function'; // assume the re-export is a function
            doc_5.name = symbol.getName();
            var types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            var sigs = types.getCallSignatures();
            doc_5.signatures = sigs.map(getDocEntryFromSignature);
            current.members[doc_5.name] = doc_5;
        }
    }
    ts.forEachChild(node, visit);
}
function getDocEntryFromSignature(signature) {
    var paramEntries = [];
    var params = signature.parameters;
    params.forEach(function (ps) {
        var de = {};
        de.name = ps.getName();
        var decls = ps.declarations;
        var paramType = checker.getTypeAtLocation(decls[0]);
        de.type = checker.typeToString(paramType);
        de.optional = checker.isOptionalParameter(ps.declarations[0]);
        de.documentation = ts.displayPartsToString(ps.getDocumentationComment());
        paramEntries.push(de);
    });
    var e = {
        parameters: paramEntries,
        members: {},
        "return": checker.typeToString(signature.getReturnType()),
        documentation: ts.displayPartsToString(signature.getDocumentationComment())
    };
    return e;
}
function getDocEntryFromSymbol(symbol) {
    return {
        name: symbol.getName(),
        members: {},
        documentation: ts.displayPartsToString(symbol.getDocumentationComment())
    };
}
/** True if this is visible outside this file, false otherwise */
function isNodeExported(node) {
    return (node.flags & ts.NodeFlags.ExportContext) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
}
//
// convenience stack
//
var push = function (entry) {
    stack.push(entry);
    current = entry;
};
var pop = function () {
    current = stack.pop();
    current = stack[stack.length - 1];
    return current;
};
var doc = {};
doc.members = {};
var stack = [];
var current = doc;
push(doc);
console.log(generate(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}));
