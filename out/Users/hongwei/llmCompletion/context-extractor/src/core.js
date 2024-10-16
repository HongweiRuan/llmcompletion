"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = exports.extractRelevantHeaders = exports.extractRelevantTypes = exports.getHoleContext = exports.getAnnotatedFunctionHoleContext = void 0;
const utils_js_1 = require("./utils.js");
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
// get context of the hole
// currently only matching ES6 arrow functions
const getAnnotatedFunctionHoleContext = (sketchFileContent) => {
    const es6AnnotatedArrowFunctionPattern = /(const )(.+)(: )(\(.+\) => .+)( =[\s\S]*_())/;
    const firstPatternIndex = sketchFileContent.search(es6AnnotatedArrowFunctionPattern);
    const match = sketchFileContent.match(es6AnnotatedArrowFunctionPattern);
    const functionName = match[2];
    const functionTypeSpan = match[4];
    const linePosition = (sketchFileContent.substring(0, firstPatternIndex).match(/\n/g)).length;
    const characterPosition = (0, utils_js_1.indexOfRegexGroup)(match, 4) - firstPatternIndex;
    return { functionName: functionName, functionTypeSpan: functionTypeSpan, linePosition: linePosition, characterPosition: characterPosition };
};
exports.getAnnotatedFunctionHoleContext = getAnnotatedFunctionHoleContext;
// get context of the hole using hole function
const getHoleContext = async (c, injectedSketchFilePath, injectedSketchFileContent) => {
    const holePattern = /_\(\)/;
    const firstPatternIndex = injectedSketchFileContent.search(holePattern);
    const linePosition = (injectedSketchFileContent.substring(0, firstPatternIndex).match(/\n/g)).length;
    const characterPosition = firstPatternIndex - injectedSketchFileContent.split("\n", linePosition).join("\n").length - 1;
    const holeHoverResult = await c.hover({
        textDocument: {
            uri: injectedSketchFilePath
        },
        position: {
            character: characterPosition,
            line: linePosition
        }
    });
    const formattedHoverResult = holeHoverResult.contents.value.split("\n").reduce((acc, curr) => {
        if (curr != "" && curr != "```typescript" && curr != "```") {
            return acc + curr;
        }
        else {
            return acc;
        }
    }, "");
    // function _<(a: Apple, c: Cherry, b: Banana) => Cherry > (): (a: Apple, c: Cherry, b: Banana) => Cherry
    const holeFunctionPattern = /(function _)(\<.+\>)(\(\): )(.+)/;
    const match = formattedHoverResult.match(holeFunctionPattern);
    const functionName = "_()";
    const functionTypeSpan = match[4];
    return { fullHoverResult: formattedHoverResult, functionName: functionName, functionTypeSpan: functionTypeSpan, linePosition: linePosition, characterPosition: characterPosition };
};
exports.getHoleContext = getHoleContext;
// // get target types given a type span
// const getTargetTypes = (typeSpan: string, aliasContext: string) => {
//   // (Model, Action) => Model
//   // if the expected type is an arrow type, the return type is a target type.
//   // if the return type is a product type, its elements are target types.
//
//   const targetTypes = [];
//   targetTypes.push(typeSpan);
//   const arrowPattern = /(\(.+\))( => )(.+)/;
//   const arrowMatch = typeSpan.match(arrowPattern);
//   if (arrowMatch) {
//     const returnType = arrowMatch[3];
//     targetTypes.push(returnType);
//
//     const tuplePattern = /(\[.+\])/;
//     if (aliasContext.has(returnType)) {
//       const alias = aliasContext.get(returnType);
//       console.log(alias)
//       const tupleMatch = alias.match(tuplePattern);
//
//       if (tupleMatch) {
//         alias.slice(1, alias.length - 1).split(",").map((typ) => targetTypes.push(typ));
//       }
//     }
//   }
//   console.log("targetTypes: ", targetTypes);
//   return targetTypes;
// }
// pattern matching
// attempts to match strings to corresponding types, then returns an object containing the name, type span, and an interesting index
// base case - type can no longer be stepped into
// boolean, number, string, enum, unknown, any, void, null, undefined, never
// ideally this should be checked for before we do the for loop
// return typeSpan;
// check if hover result is from a primitive type
const checkPrimitive = (typeDefinition) => {
    // type _ = boolean
    const primitivePattern = /(type )(.+)( = )(.+)/;
    const primitiveMatch = typeDefinition.match(primitivePattern);
    let primitiveInterestingIndex = -1;
    if (primitiveMatch) {
        primitiveInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(primitiveMatch, 4);
    }
    if (primitiveInterestingIndex != -1) {
        const typeName = primitiveMatch[2];
        const typeSpan = primitiveMatch[4];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: primitiveInterestingIndex };
    }
    return null;
};
// check if hover result is from an import
const checkImports = (typeDefinition) => {
    // import { _, _ };
    const importPattern = /(import )(\{.+\})/;
    const importMatch = typeDefinition.match(importPattern);
    let importInterestingIndex = -1;
    if (importMatch) {
        importInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(importMatch, 2);
    }
    // import _;
    const defaultImportPattern = /(import )(.+)/;
    const defaultImportMatch = typeDefinition.match(defaultImportPattern);
    let defaultImportInterestingIndex = -1;
    if (defaultImportMatch) {
        defaultImportInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(defaultImportMatch, 2);
    }
    if (importInterestingIndex != -1) {
        const typeName = importMatch[2];
        const typeSpan = importMatch[2];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: importInterestingIndex };
    }
    else if (defaultImportInterestingIndex != -1) {
        const typeName = defaultImportMatch[2];
        const typeSpan = defaultImportMatch[2];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: defaultImportInterestingIndex };
    }
    return null;
};
// check if hover result is from a module
const checkModule = (typeDefinition) => {
    // module "path/to/module"
    const modulePattern = /(module )(.+)/;
    const moduleMatch = typeDefinition.match(modulePattern);
    let moduleInterestingIndex = -1;
    if (moduleMatch) {
        moduleInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(moduleMatch, 2);
    }
    if (moduleInterestingIndex != -1) {
        const typeName = moduleMatch[2];
        const typeSpan = moduleMatch[2];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: moduleInterestingIndex };
    }
    return null;
};
// check if hover result is from an object
const checkObject = (typeDefinition) => {
    // type _ = {
    //   _: t1;
    //   _: t2;
    // }
    const objectTypeDefPattern = /(type )(.+)( = )(\{.+\})/;
    const objectTypeDefMatch = typeDefinition.match(objectTypeDefPattern);
    let objectTypeDefInterestingIndex = -1;
    if (objectTypeDefMatch) {
        objectTypeDefInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(objectTypeDefMatch, 4);
    }
    if (objectTypeDefInterestingIndex != -1) {
        const typeName = objectTypeDefMatch[2];
        const typeSpan = objectTypeDefMatch[4];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: objectTypeDefInterestingIndex };
    }
    return null;
};
// check if hover result is from a union
const checkUnion = (typeDefinition) => {
    // type _ = A | B | C
    const unionPattern = /(type )(.+)( = )((.+ | )+.+)/;
    const unionMatch = typeDefinition.match(unionPattern);
    let unionInterestingIndex = -1;
    if (unionMatch) {
        unionInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(unionMatch, 4);
    }
    if (unionInterestingIndex != -1) {
        const typeName = unionMatch[2];
        const typeSpan = unionMatch[4];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: unionInterestingIndex };
    }
    return null;
};
// check if hover result is from a function
const checkFunction = (typeDefinition) => {
    // const myFunc : (arg1: typ1, ...) => _
    const es6AnnotatedFunctionPattern = /(const )(.+)(: )(\(.+\) => .+)/;
    const es6AnnotatedFunctionMatch = typeDefinition.match(es6AnnotatedFunctionPattern);
    let es6AnnotatedFunctionInterestingIndex = -1;
    if (es6AnnotatedFunctionMatch) {
        es6AnnotatedFunctionInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(es6AnnotatedFunctionMatch, 4);
    }
    // type _ = (_: t1) => t2
    const es6FunctionTypeDefPattern = /(type )(.+)( = )(\(.+\) => .+)/;
    const es6FunctionTypeDefPatternMatch = typeDefinition.match(es6FunctionTypeDefPattern);
    let es6FunctionTypeDefInterestingIndex = -1;
    if (es6FunctionTypeDefPatternMatch) {
        es6FunctionTypeDefInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(es6FunctionTypeDefPatternMatch, 4);
    }
    // function myFunc<T>(args: types, genarg: T): returntype
    const genericFunctionTypePattern = /(function )(.+)(\<.+\>\(.*\))(: )(.+)/;
    const genericFunctionTypeMatch = typeDefinition.match(genericFunctionTypePattern);
    let genericFunctionTypeInterestingIndex = -1;
    if (genericFunctionTypeMatch) {
        genericFunctionTypeInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(genericFunctionTypeMatch, 3);
    }
    // function myFunc(args: types): returntype
    const functionTypePattern = /(function )(.+)(\(.*\))(: )(.+)/;
    const functionTypeMatch = typeDefinition.match(functionTypePattern);
    let functionTypeInterestingIndex = -1;
    if (functionTypeMatch) {
        functionTypeInterestingIndex = (0, utils_js_1.indexOfRegexGroup)(functionTypeMatch, 3);
    }
    if (es6AnnotatedFunctionInterestingIndex != -1) {
        const typeName = es6AnnotatedFunctionMatch[2];
        const typeSpan = es6AnnotatedFunctionMatch[4];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: es6AnnotatedFunctionInterestingIndex };
    }
    else if (es6FunctionTypeDefInterestingIndex != -1) {
        const typeName = es6FunctionTypeDefPatternMatch[2];
        const typeSpan = es6FunctionTypeDefPatternMatch[4];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: es6FunctionTypeDefInterestingIndex };
    }
    else if (genericFunctionTypeInterestingIndex != -1) {
        const typeName = genericFunctionTypeMatch[2];
        const typeSpan = genericFunctionTypeMatch[3] + genericFunctionTypeMatch[4] + genericFunctionTypeMatch[5];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: genericFunctionTypeInterestingIndex };
    }
    else if (functionTypeInterestingIndex != -1) {
        const typeName = functionTypeMatch[2];
        const typeSpan = functionTypeMatch[3] + functionTypeMatch[4] + functionTypeMatch[5];
        return { typeName: typeName, typeSpan: typeSpan, interestingIndex: functionTypeInterestingIndex };
    }
    return null;
};
// check if hover result is from a hole
const checkHole = (typeDefinition) => {
    // (type parameter) T in _<T>(): T
    const holePattern = /(\(type parameter\) T in _\<T\>\(\): T)/;
    const match = typeDefinition.match(holePattern);
    if (match) {
        const typeName = "hole function";
        const typeSpan = match[1];
        return { typeName: typeName, typeSpan: typeSpan };
    }
    return null;
};
// check if hover result is from a parameter
const checkParameter = (typeDefinition) => {
    // (parameter) name: type
    // const parameterPattern = /(\(parameter\) )(.+)(: )(.+))/;
    // const parameterMatch = typeDefinition.match(parameterPattern);
    // let parameterInterestingIndex = -1;
    // if (parameterMatch) {
    //   parameterInterestingIndex = indexOfRegexGroup(parameterMatch, 4);
    // }
    //
    // if (parameterInterestingIndex != -1) {
    //   const typeName = parameterMatch[2];
    //   const typeSpan = parameterMatch[4];
    //   return { typeName: typeName, typeSpan: typeSpan, interestingIndex: parameterInterestingIndex }
    // }
    return null;
};
// get type context from hover result
const getTypeContext = (typeDefinition) => {
    if (checkHole(typeDefinition)) {
        return checkHole(typeDefinition);
    }
    else if (checkParameter(typeDefinition)) {
        return checkParameter(typeDefinition);
    }
    else if (checkFunction(typeDefinition)) {
        return checkFunction(typeDefinition);
    }
    else if (checkUnion(typeDefinition)) {
        return checkUnion(typeDefinition);
    }
    else if (checkObject(typeDefinition)) {
        return checkObject(typeDefinition);
    }
    else if (checkImports(typeDefinition)) {
        return checkImports(typeDefinition);
    }
    else if (checkModule(typeDefinition)) {
        return checkModule(typeDefinition);
    }
    else {
        return checkPrimitive(typeDefinition);
    }
};
// recursively extract type definitions
// given the span of a type annotation on a function, return a list of names and positions for all type aliases used in that annotation
// find the span of a type definition: specialize to the case where it is a single struct
// recurse through array, tuple, object
const extractRelevantTypes = async (c, fullHoverResult, typeName, typeSpan, linePosition, characterPosition, foundSoFar, currentFile, outputFile, depth) => {
    if (!foundSoFar.has(typeName)) {
        foundSoFar.set(typeName, fullHoverResult);
        outputFile.write(`${fullHoverResult};\n`);
        // approach 1: go to type definition and hover
        const content = fs.readFileSync(currentFile.slice(7), "utf8");
        const charInLine = (0, child_process_1.execSync)(`wc -m <<< "${content.split("\n")[linePosition].slice(characterPosition)}"`, { shell: "/bin/bash" });
        // -1 is done to avoid tsserver errors
        for (let i = 0; i < Math.min(parseInt(charInLine.toString()), typeSpan.length) - 1; i++) {
            try {
                const typeDefinitionResult = await c.typeDefinition({
                    textDocument: {
                        uri: currentFile
                    },
                    position: {
                        character: characterPosition + i,
                        line: linePosition
                    }
                });
                if (typeDefinitionResult && typeDefinitionResult instanceof Array && typeDefinitionResult.length != 0) {
                    // use documentSymbol instead of hover.
                    // this prevents type alias "squashing" done by tsserver.
                    // this also allows for grabbing the entire definition range and not just the symbol range.
                    const documentSymbolResult = await c.documentSymbol({
                        textDocument: {
                            uri: typeDefinitionResult[0].uri
                        }
                    });
                    // grab if the line number of typeDefinitionResult and documentSymbolResult matches
                    const dsMap = documentSymbolResult.reduce((m, obj) => {
                        m.set(obj.location.range.start.line, obj.location.range);
                        return m;
                    }, new Map());
                    const matchingSymbolRange = dsMap.get(typeDefinitionResult[0].range.start.line);
                    if (matchingSymbolRange) {
                        const snippetInRange = (0, utils_js_1.extractSnippet)(fs.readFileSync(typeDefinitionResult[0].uri.slice(7)).toString("utf8"), matchingSymbolRange.start, matchingSymbolRange.end);
                        const typeContext = getTypeContext(snippetInRange);
                        const formattedTypeSpan = (0, utils_js_1.formatTypeSpan)(snippetInRange);
                        await extractRelevantTypes(c, snippetInRange, typeContext.typeName, formattedTypeSpan, typeDefinitionResult[0].range.start.line, typeDefinitionResult[0].range.end.character + 2, foundSoFar, typeDefinitionResult[0].uri, outputFile, depth + 1);
                    }
                    // // try hover on the goto result
                    // const hoverResult = await c.hover({
                    //   textDocument: {
                    //     uri: (typeDefinitionResult[0] as Location).uri
                    //   },
                    //   position: {
                    //     character: (typeDefinitionResult[0] as Location).range.start.character,
                    //     line: (typeDefinitionResult[0] as Location).range.start.line
                    //   }
                    // });
                    // // console.log("hoverResult: ", hoverResult)
                    //
                    // if (hoverResult != null) {
                    //   console.log(`${JSON.stringify(typeDefinitionResult)}\n${JSON.stringify(hoverResult)}\n`);
                    //   const formattedHoverResult = (hoverResult.contents as MarkupContent).value.split("\n").reduce((acc, curr) => {
                    //     if (curr != "" && curr != "```typescript" && curr != "```") {
                    //       return acc + curr;
                    //     } else {
                    //       return acc;
                    //     }
                    //   }, "");
                    //
                    //   const typeContext = getTypeContext(formattedHoverResult);
                    //   // console.log("typeContext: ", typeContext);
                    //
                    //   // TODO:
                    //   // This could be buggy if there are multi-line type signatures.
                    //   // Because hover returns a formatted type signature, it could also include newlines.
                    //   // This means that iterating over typeSpan.length might crash if it steps off the edge.
                    //
                    //   const formattedTypeSpan = formatTypeSpan(typeContext!.typeSpan);
                    //   console.log(`opt 2: ${formattedHoverResult}\n${typeContext}\n${formattedTypeSpan}`)
                    //
                    //   await extractRelevantTypes(
                    //     c,
                    //     formattedHoverResult,
                    //     typeContext!.typeName,
                    //     formattedTypeSpan,
                    //     (typeDefinitionResult[0] as Location).range.start.line,
                    //     (typeDefinitionResult[0] as Location).range.end.character + 2,
                    //     foundSoFar,
                    //     (typeDefinitionResult[0] as Location).uri, outputFile, depth + 1);
                    // }
                }
                else {
                }
            }
            catch (err) {
                console.log(`${err}`);
            }
        }
    }
    return foundSoFar;
};
exports.extractRelevantTypes = extractRelevantTypes;
// return a list relevant context
// this would be akin to a LSP completion menu, but better
// filter the typing context for values whose types stand in a certain relation to these target types
// assign scores to each element of the resulting list, and return the prefix of that list truncated at some scoring and length thresholds
const extractRelevantHeaders = (preludeContent, relevantTypes, holeType) => {
    // TODO:
    // assign scores to each element of the resulting list, and return const ts = require('typescript');
    // console.log(`\n\nrelevantTypes: ${[...relevantTypes.entries()]}\n`)
    const relevantContext = new Set();
    const targetTypes = generateTargetTypes(relevantTypes, holeType);
    // only consider lines that start with let or const
    const filteredLines = preludeContent.split("\n").filter((line) => {
        return line.slice(0, 3) === "let" || line.slice(0, 5) === "const";
    });
    // check for relationship between each line and relevant types
    filteredLines.forEach(line => {
        const splittedLine = line.split(" = ")[0];
        const typeSpanPattern = /(^[^:]*: )(.+)/;
        const returnTypeSpan = splittedLine.match(typeSpanPattern)[2];
        if (!(0, utils_js_1.isPrimitive)(returnTypeSpan.split(" => ")[1])) {
            extractRelevantHeadersHelper(returnTypeSpan, targetTypes, relevantTypes, relevantContext, splittedLine);
        }
    });
    return Array.from(relevantContext);
};
exports.extractRelevantHeaders = extractRelevantHeaders;
const generateTargetTypes = (relevantTypes, holeType) => {
    const targetTypes = new Set();
    targetTypes.add(holeType);
    getTargetTypesHelper(relevantTypes, holeType, targetTypes);
    return targetTypes;
};
const getTargetTypesHelper = (relevantTypes, currType, targetTypes) => {
    // console.log("===Helper===")
    if ((0, utils_js_1.isFunction)(currType)) {
        const functionPattern = /(\(.+\))( => )(.+)(;*)/;
        const rettype = currType.match(functionPattern)[3];
        targetTypes.add(rettype);
        getTargetTypesHelper(relevantTypes, rettype, targetTypes);
    }
    else if ((0, utils_js_1.isTuple)(currType)) {
        const elements = (0, utils_js_1.parseTypeArrayString)(currType);
        elements.forEach(element => {
            targetTypes.add(element);
            getTargetTypesHelper(relevantTypes, element, targetTypes);
        });
    }
    // else if (isArray(currType)) {
    //   const elementType = currType.split("[]")[0];
    //
    //   targetTypes.add(elementType)
    //   getTargetTypesHelper(relevantTypes, elementType, targetTypes);
    // } 
    else {
        if (relevantTypes.has(currType)) {
            const definition = relevantTypes.get(currType).split(" = ")[1];
            getTargetTypesHelper(relevantTypes, definition, targetTypes);
        }
    }
};
// resursive helper for extractRelevantContext
// checks for nested type equivalence
const extractRelevantHeadersHelper = (typeSpan, targetTypes, relevantTypes, relevantContext, line) => {
    targetTypes.forEach(typ => {
        if (isTypeEquivalent(typeSpan, typ, relevantTypes)) {
            relevantContext.add(line);
        }
        if ((0, utils_js_1.isFunction)(typeSpan)) {
            const functionPattern = /(\(.+\))( => )(.+)/;
            const rettype = typeSpan.match(functionPattern)[3];
            extractRelevantHeadersHelper(rettype, targetTypes, relevantTypes, relevantContext, line);
        }
        else if ((0, utils_js_1.isTuple)(typeSpan)) {
            const elements = (0, utils_js_1.parseTypeArrayString)(typeSpan);
            // const elements = typeSpan.slice(1, typeSpan.length - 1).split(", ");
            elements.forEach(element => {
                extractRelevantHeadersHelper(element, targetTypes, relevantTypes, relevantContext, line);
            });
        }
        // else if (isUnion(typeSpan)) {
        //   const elements = typeSpan.split(" | ");
        //
        //   elements.forEach(element => {
        //     extractRelevantContextHelper(element, relevantTypes, relevantContext, line);
        //   });
        //
        // else if (isArray(typeSpan)) {
        //   const elementType = typeSpan.split("[]")[0];
        //
        //   if (isTypeEquivalent(elementType, typ, relevantTypes)) {
        //     extractRelevantContextHelper(elementType, targetTypes, relevantTypes, relevantContext, line);
        //   }
        // }
    });
};
// two types are equivalent if they have the same normal forms
const isTypeEquivalent = (t1, t2, relevantTypes) => {
    const normT1 = normalize(t1, relevantTypes);
    const normT2 = normalize(t2, relevantTypes);
    return normT1 === normT2;
};
// return the normal form given a type span and a set of relevant types
// TODO: replace type checking with information from the AST?
const normalize = (typeSpan, relevantTypes) => {
    let normalForm = "";
    // pattern matching for typeSpan
    if ((0, utils_js_1.isPrimitive)(typeSpan)) {
        return typeSpan;
    }
    else if ((0, utils_js_1.isObject)(typeSpan)) {
        const elements = typeSpan.slice(1, typeSpan.length - 2).split(";");
        normalForm += "{";
        elements.forEach(element => {
            if (element !== "") {
                const kv = element.split(": ");
                normalForm += kv[0].slice(1, kv[0].length), ": ", normalize(kv[1], relevantTypes);
                normalForm += "; ";
            }
        });
        normalForm += "}";
        return normalForm;
    }
    else if ((0, utils_js_1.isTuple)(typeSpan)) {
        // const elements = typeSpan.slice(1, typeSpan.length - 1).split(", ");
        const elements = (0, utils_js_1.parseTypeArrayString)(typeSpan);
        normalForm += "[";
        elements.forEach((element, i) => {
            normalForm += normalize(element, relevantTypes);
            if (i < elements.length - 1) {
                normalForm += ", ";
            }
        });
        normalForm += "]";
        return normalForm;
    }
    else if ((0, utils_js_1.isUnion)(typeSpan)) {
        const elements = typeSpan.split(" | ");
        elements.forEach((element, i) => {
            normalForm += "(";
            normalForm += normalize(element, relevantTypes);
            normalForm += ")";
            if (i < elements.length - 1) {
                normalForm += " | ";
            }
        });
        return normalForm;
    }
    else if ((0, utils_js_1.isArray)(typeSpan)) {
        const element = typeSpan.split("[]")[0];
        normalForm += normalize(element, relevantTypes);
        normalForm += "[]";
        return normalForm;
    }
    else if ((0, utils_js_1.isTypeAlias)(typeSpan)) {
        const typ = relevantTypes.get(typeSpan)?.split(" = ")[1];
        if (typ === undefined) {
            return typeSpan;
        }
        normalForm += normalize(typ, relevantTypes);
        return normalForm;
    }
    else {
        return typeSpan;
    }
};
exports.normalize = normalize;
//# sourceMappingURL=core.js.map