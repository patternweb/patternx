import * as ts from 'typescript';
import * as fs from 'fs';
var path = require('path');

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

export interface DocEntry {
    name?: string,
    type?: string,
    optional?: boolean,
    documentation?: string,
    kind?: string,
    signatures?: DocEntry[],
    parameters?: DocEntry[],
    functions?: DocEntry[],
    return?: string,
    constructors?: DocEntry[],
    members?: { string: [DocEntry]};
};

let program: ts.Program;
let checker: ts.TypeChecker;

export function generate(filePaths: string[], options: ts.CompilerOptions): DocEntry {
    let fullFilePaths = filePaths.map(name => `node_modules/@types/${name}/index.d.ts` )

    program = ts.createProgram(fullFilePaths, options);
    checker = program.getTypeChecker();

    let files: ts.SourceFile[] = program.getSourceFiles();
    for (const sourceFile of program.getSourceFiles()) {
        // only document files we specified. dependency files may be in program
        // if (filePaths.indexOf(sourceFile.fileName) >= 0) {
        if (sourceFile.fileName === 'node_modules/@types/three/index.d.ts') {
            let name = path.basename(sourceFile.fileName, '.d.ts');
            console.log('Processing:', sourceFile.fileName);

            let fd: DocEntry = {
                name: name,
                kind: 'file',
                members: {} as { string: [DocEntry]}
            };

            doc.members[name] = fd;
            push(fd);

            ts.forEachChild(sourceFile, visit);
        }
    }
    fs.writeFileSync(`public/libs/lodash.json`, JSON.stringify(doc, undefined, 2));
    return doc;
}

let inClass = false;

function visit(node: ts.Node): void {

    if (node.kind == ts.SyntaxKind.ClassDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }

        let cd: ts.ClassDeclaration = <ts.ClassDeclaration>node;
        let symbol = checker.getSymbolAtLocation(cd.name);
        if (symbol) {

            let doc: DocEntry = getDocEntryFromSymbol(symbol);
            doc.kind = 'class';

            if (inClass) {
                pop();
            }
            inClass = true;

            let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            doc.constructors = constructorType.getConstructSignatures().map(getDocEntryFromSignature);
            current.members[doc.name] = doc;

            push(doc);
        }
    }
    else if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }
        let id: ts.InterfaceDeclaration = <ts.InterfaceDeclaration>node;
        let symbol = checker.getSymbolAtLocation(id.name);
        if (symbol) {
            let doc: DocEntry = getDocEntryFromSymbol(symbol);
            doc.kind = 'interface';

            if (inClass) {
                pop();
            }
            inClass = true;

            let types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);

            let st: ts.SymbolTable = symbol.members;
            for (let memberName in st) {
                var s: ts.Symbol = st[memberName];
                let memberDeclarations: ts.Declaration[] = s.getDeclarations();
                if (memberDeclarations.length > 0) {
                    let memberDoc: DocEntry = {};
                    memberDoc.documentation = ts.displayPartsToString(s.getDocumentationComment());
                    memberDoc.name = memberName;
                    memberDoc.return = checker.typeToString(checker.getTypeAtLocation(memberDeclarations[0]))
                    doc.members[memberName] = memberDoc;
                }
            }

            current.members[doc.name] = doc;
            push(doc);
        }
    }
    if (node.kind == ts.SyntaxKind.EndOfFileToken) {
        inClass = false;
        current = doc;
    }
    else if (node.kind == ts.SyntaxKind.MethodDeclaration) {
        let m: ts.MethodDeclaration = <ts.MethodDeclaration>node;
        let symbol = checker.getSymbolAtLocation(m.name);

        if (symbol) {
            let doc: DocEntry = getDocEntryFromSymbol(symbol);
            doc.kind = 'method';
            doc.name = symbol.getName();
            let types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            let sigs = types.getCallSignatures();
            doc.signatures = sigs.map(getDocEntryFromSignature);

            current.members[doc.name] = doc;
        }
    }
    else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
        if (!isNodeExported(node)) {
            return;
        }

        let f: ts.FunctionDeclaration = <ts.FunctionDeclaration>node;

        if (inClass) {
            pop();
        }
        inClass = false;

        let symbol = checker.getSymbolAtLocation(f.name);
        if (symbol) {
            let doc: DocEntry = getDocEntryFromSymbol(symbol);
            doc.kind = 'function';
            doc.name = symbol.getName();

            let types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            let sigs = types.getCallSignatures();
            doc.signatures = sigs.map(getDocEntryFromSignature);

            current.members[doc.name] = doc;
        }
    }
    // handle re-export from internal.ts
    else if (node.kind === ts.SyntaxKind.VariableStatement && node.flags === ts.NodeFlags.Export) {
        let statement = <ts.VariableStatement>node;
        let list: ts.VariableDeclarationList = statement.declarationList;
        for (let declaration of list.declarations) {
            let symbol = checker.getSymbolAtLocation(declaration.name);
            let doc: DocEntry = getDocEntryFromSymbol(symbol);
            doc.kind = 'function'; // assume the re-export is a function
            doc.name = symbol.getName();
            let types = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            let sigs = types.getCallSignatures();
            doc.signatures = sigs.map(getDocEntryFromSignature);
            current.members[doc.name] = doc;
        }
    }

    ts.forEachChild(node, visit);
}

function getDocEntryFromSignature(signature: ts.Signature): DocEntry {
    let paramEntries: DocEntry[] = [];
    let params: ts.Symbol[] = signature.parameters;
    params.forEach((ps: ts.Symbol) => {
        let de = {} as DocEntry;
        de.name = ps.getName();

        let decls: ts.Declaration[] = ps.declarations;
        let paramType: ts.Type = checker.getTypeAtLocation(decls[0]);
        de.type = checker.typeToString(paramType);
        de.optional = checker.isOptionalParameter(ps.declarations[0] as ts.ParameterDeclaration);
        de.documentation = ts.displayPartsToString(ps.getDocumentationComment());
        paramEntries.push(de);
    });

    let e: DocEntry = {
        parameters: paramEntries,
        members: {} as { string: [DocEntry]},
        return: checker.typeToString(signature.getReturnType()),
        documentation: ts.displayPartsToString(signature.getDocumentationComment())
    };

    return e;
}

function getDocEntryFromSymbol(symbol: ts.Symbol): DocEntry {
    return {
        name: symbol.getName(),
        members: {} as { string: [DocEntry]},
        documentation: ts.displayPartsToString(symbol.getDocumentationComment()),

        //type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
    };
}

    /** True if this is visible outside this file, false otherwise */
function isNodeExported(node: ts.Node): boolean {
    return (node.flags & ts.NodeFlags.ExportContext) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
}

//
// convenience stack
//

let push = function(entry: DocEntry) {
    stack.push(entry);
    current = entry;
}

let pop = function(): DocEntry {
    current = stack.pop();
    current = stack[stack.length - 1];
    return current;
}

let doc: DocEntry = {};
doc.members = {} as { string: [DocEntry]};
let stack: DocEntry[] = [];
let current: DocEntry = doc;
push(doc);

console.log(generate(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}));
