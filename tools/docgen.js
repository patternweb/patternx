"use strict";
exports.__esModule = true;
var ts = require("typescript");
var fs = require("fs");
;
/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(fileNames, options) {
    var fullFileNames = fileNames.map(function (name) { return "node_modules/@types/" + name + "/index.d.ts"; });
    console.log(fullFileNames);
    // Build a program using the set of root file names in fileNames
    var program = ts.createProgram(fileNames, options);
    // Get the checker, we will use it to find more about classes
    var checker = program.getTypeChecker();
    var output = [];
    // Visit every sourceFile in the program
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }
    // print out the doc
    fs.writeFileSync("public/libs/" + fileNames[0] + ".json", JSON.stringify(output, undefined, 2));
    fs.writeFileSync("public/libs/" + fileNames[0] + ".min.json", JSON.stringify(output));
    return;
    function getFullyQualifiedName(expression) {
        var symbol = checker.getSymbolAtLocation(expression.expression);
        if (symbol) {
            var nameParts = checker.getFullyQualifiedName(symbol).split(".");
            if (symbol.declarations.length > 0 && symbol.declarations[0].kind === ts.SyntaxKind.ImportSpecifier) {
                // symbol comes from an imported module
                // get the module name from the import declaration
                var importSpecifier = symbol.declarations[0];
                var moduleName = importSpecifier.parent.parent.parent.moduleSpecifier.text;
                nameParts.unshift(moduleName);
            }
            else {
                if (nameParts.length > 0 && nameParts[0].indexOf("\"") === 0) {
                    // if first name part has " then it should be a module name
                    var moduleName = nameParts[0].replace(/\"/g, ""); // remove " from module name
                    nameParts[0] = moduleName;
                }
            }
            return nameParts;
        }
        console.warn("Unable to resolve type: '" + expression.getText() + "'");
        return ["unknown?"];
    }
    /** visit nodes finding exported classes */
    function visit(node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // This is a top level class, get its symbol
            var classDeclaration = node;
            var symbol = checker.getSymbolAtLocation((classDeclaration).name);
            if (classDeclaration.heritageClauses && classDeclaration.heritageClauses.length > 0) {
                console.log(symbol.getName(), " < ", getFullyQualifiedName(classDeclaration.heritageClauses[0].types[0])[1]);
                //   let parent = checker.getSymbolAtLocation(node.parent)
                //   if (parent && parent.flags && ts.SymbolFlags.Class) {
                //     console.log('class')
                //     console.log(parent.getName())
                //   } else {
                //     console.log('not class')
                //   }
            }
            output.push(serializeClass(symbol));
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
        // else if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
        //   let id: ts.InterfaceDeclaration = <ts.InterfaceDeclaration>node;
        //   let symbol = checker.getSymbolAtLocation(id.name);
        //   console.log(symbol)
        // }
    }
    /** Serialize a symbol into a json object */
    function serializeSymbol(symbol) {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }
    /** Serialize a class symbol information */
    function serializeClass(symbol) {
        var details = serializeSymbol(symbol);
        // if (symbol.parent) {
        //   console.log(symbol.parent)
        //   console.log('------------------------------------------------------')
        //   details.extends = symbol.parent.getName()
        // }
        if (symbol.members) {
            var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
            var members_1 = [];
            symbol.members.forEach(function (member) { return members_1.push(member); });
            var serializedMembers = members_1.slice(1).map(serializeClass);
            details.properties = serializedMembers.filter(function (m) { return !m.type.startsWith("("); });
            details.methods = serializedMembers.filter(function (m) { return m.type.startsWith("("); });
        }
        return details;
    }
    function serializeProperty(property) {
        return _a = {},
            _a[property.name] = property.name,
            _a;
        var _a;
    }
    /** Serialize a signature (call or construct) */
    function serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment())
        };
    }
    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node) {
        return (node.flags & ts.NodeFlags.ExportContext) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}
generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
});
