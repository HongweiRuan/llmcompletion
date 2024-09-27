"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const types_1 = require("./types");
// extract("/home/jacob/projects/context-extractor/targets/todo/sketch.ts").then(r => console.log("todo\n", r));
// extract("/home/jacob/projects/context-extractor/targets/playlist/sketch.ts").then(r => console.log("playlist\n", r));
// extract("/home/jacob/projects/context-extractor/targets/passwords/sketch.ts").then(r => console.log("passwords\n", r));
// extract("/home/jacob/projects/context-extractor/targets/booking/sketch.ts").then(r => console.log("booking\n", r));
// extract("/home/jacob/projects/context-extractor/targets/emojipaint/sketch.ts").then(r => console.log("emojipaint\n", r));
(0, main_1.extractWithNew)(types_1.Language.TypeScript, "/home/jacob/projects/context-extractor/targets/todo/sketch.ts", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("todo\n", r));
// extractWithNew(Language.TypeScript, "/home/jacob/projects/context-extractor/targets/playlist/sketch.ts", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("playlist\n", r));
// extractWithNew(Language.TypeScript, "/home/jacob/projects/context-extractor/targets/passwords/sketch.ts", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("passwords\n", r));
// extractWithNew(Language.TypeScript, "/home/jacob/projects/context-extractor/targets/booking/sketch.ts", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("booking\n", r));
// extractWithNew(Language.TypeScript, "/home/jacob/projects/context-extractor/targets/emojipaint/sketch.ts", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("emojipaint\n", r));
(0, main_1.extractWithNew)(types_1.Language.OCaml, "/home/jacob/projects/context-extractor/targets/ocaml/todo/sketch.ml", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("todo\n", r));
// extractWithNew(Language.OCaml, "/home/jacob/projects/context-extractor/targets/ocaml/playlist/sketch.ml", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("playlist\n", r));
// extractWithNew(Language.OCaml, "/home/jacob/projects/context-extractor/targets/ocaml/passwords/sketch.ml", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("passwords\n", r));
// extractWithNew(Language.OCaml, "/home/jacob/projects/context-extractor/targets/ocaml/booking/sketch.ml", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("booking\n", r));
// extractWithNew(Language.OCaml, "/home/jacob/projects/context-extractor/targets/ocaml/emojipaint/sketch.ml", "/home/jacob/projects/context-extractor/credentials.json").then(r => console.log("emojipaint\n", r));
// extractWithNew(Language.TypeScript, "/app/targets/todo/sketch.ts").then(r => console.log("todo\n", r));
//# sourceMappingURL=runner.js.map