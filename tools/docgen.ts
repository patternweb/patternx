import * as ts from "typescript";
import * as fs from "fs";

interface DocEntry {
  name?: string;
  fileName?: string;
  extends?: string;
  documentation?: string;
  type?: string;
  required?: boolean;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  properties?: DocEntry[];
  methods?: DocEntry[];
  returnType?: string;
}

function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  let fullFileNames = fileNames.map(
    name => `node_modules/@types/${name}/index.d.ts`
  );

  if (fileNames === ["typescript"]) {
    fullFileNames = [
      "/Users/john/Code/patternweb/patternx/node_modules/typescript/lib/lib.d.ts"
    ];
  }

  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fullFileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let output: DocEntry[] = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    // Walk the tree to search for classes
    if (
      fileNames.some(function(v) {
        return sourceFile.fileName.indexOf(v) >= 0;
      })
    ) {
      console.log(sourceFile.fileName);
      ts.forEachChild(sourceFile, visit);
    } else {
      console.log("NOT INCLUDING", sourceFile.fileName);
    }
  }

  // LODASH-SPECIFIC
  // output = [output[0]]

  // print out the doc
  fs.writeFileSync(
    `public/libs/${fileNames[0]}.json`,
    JSON.stringify(output, undefined, 2)
  );
  fs.writeFileSync(
    `public/libs/${fileNames[0]}.min.json`,
    JSON.stringify(output)
  );

  return;

  function getFullyQualifiedName(expression: ts.ExpressionWithTypeArguments) {
    let symbol = checker.getSymbolAtLocation(expression.expression);
    if (symbol) {
      let nameParts = checker.getFullyQualifiedName(symbol).split(".");
      if (
        symbol.declarations.length > 0 &&
        symbol.declarations[0].kind === ts.SyntaxKind.ImportSpecifier
      ) {
        // symbol comes from an imported module
        // get the module name from the import declaration
        let importSpecifier = symbol.declarations[0];
        let moduleName = (<ts.StringLiteral>(<ts.ImportDeclaration>importSpecifier
          .parent.parent.parent).moduleSpecifier).text;
        nameParts.unshift(moduleName);
      } else if (nameParts.length > 0 && nameParts[0].indexOf('"') === 0) {
        // if first name part has " then it should be a module name
        nameParts[0] = nameParts[0].replace(/\"/g, "");
      }
      return nameParts;
    }
    console.warn("Unable to resolve type: '" + expression.getText() + "'");
    return ["unknown?"];
  }

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {
    // Only consider exported nodes
    // console.log(syntaxKindToName(node.kind))
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      // if (!isNodeExported(node)) {
      //   return;
      // }
      // This is a top level class, get its symbol

      let classDeclaration = <ts.ClassDeclaration>node;
      let symbol = checker.getSymbolAtLocation(classDeclaration.name);

      if (
        classDeclaration.heritageClauses &&
        classDeclaration.heritageClauses.length > 0
      ) {
        // console.log(symbol.getName(), " < ", getFullyQualifiedName(classDeclaration.heritageClauses[0].types[0])[1])
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
    } else if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
      // if (!isNodeExported(node)) {
      //   return;
      // }
      let id: ts.InterfaceDeclaration = <ts.InterfaceDeclaration>node;
      let symbol = checker.getSymbolAtLocation(id.name);
      // console.log(symbol.getName())
      output.push(serializeClass(symbol));
    } else {
      ts.forEachChild(node, visit);
    }
    // else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
    //   // This is a namespace, visit its children
    //   ts.forEachChild(node, visit);
    // }
  }

  function syntaxKindToName(kind: ts.SyntaxKind) {
    return (<any>ts).SyntaxKind[kind];
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    const name = symbol.getName() + (symbol.declarations[0].questionToken ? "?" : "")
    const _symbol: DocEntry = {
      name,
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
      )
    };

    const documentation = ts.displayPartsToString(
      symbol.getDocumentationComment()
    );
    if (documentation && documentation !== "")
      _symbol.documentation = documentation;
    return _symbol;
  }

  /** Serialize a class symbol information */
  function serializeClass(symbol: ts.Symbol) {
    let details = serializeSymbol(symbol);

    if (symbol.members) {
      let constructorType = checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      );
      details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature);

      let members = [];
      symbol.members.forEach(member => members.push(member));
      let serializedMembers = members.slice(1).map(serializeClass);

      details.properties = serializedMembers.filter(m =>
        m.type.match(/^[a-zA-Z0-9]+$/)
      );
      details.methods = serializedMembers.filter(
        m => !m.type.match(/^[a-zA-Z0-9]+$/)
      );
    }

    return details;
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature: ts.Signature) {
    const _signature: DocEntry = {
      // documentation: ts.displayPartsToString(signature.getDocumentationComment()),
      // parameters: signature.parameters.map(serializeSymbol),
      // returnType: checker.typeToString(signature.getReturnType())
    };

    const documentation = ts.displayPartsToString(
      signature.getDocumentationComment()
    );
    if (documentation && documentation !== "")
      _signature.documentation = documentation;

    const parameters = signature.parameters.map(serializeSymbol);
    if (parameters && parameters.length > 0) _signature.parameters = parameters;

    const returnType = checker.typeToString(signature.getReturnType());
    if (returnType && returnType !== "") _signature.returnType = returnType;

    return _signature;
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node: ts.Node): boolean {
    return (
      (node.flags & ts.NodeFlags.ExportContext) !== 0 ||
      (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

generateDocumentation(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
});
