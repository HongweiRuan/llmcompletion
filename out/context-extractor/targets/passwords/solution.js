"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const prelude_1 = require("./prelude");
// PASSWORDS MVU SOLUTION
const update = (model, action) => {
    switch (action.type) {
        case "ClearCriteria":
            const [password, , strength] = model;
            return [password, [], strength];
        case "UpdatePassword":
            const [, criteria,] = model;
            const newStrength = (0, prelude_1.calculateStrength)(action.password, criteria);
            return [action.password, criteria, newStrength];
        case "AddCriterion":
            const [currentPassword, currentCriteria,] = model;
            const newCriteria = [action.criterion, ...currentCriteria];
            const updatedStrength = (0, prelude_1.calculateStrength)(currentPassword, newCriteria);
            return [currentPassword, newCriteria, updatedStrength];
        case "RemoveCriterion":
            const [pwd, crit,] = model;
            const filteredCriteria = crit.filter((c) => c.type !== action.criterion.type);
            const recalculatedStrength = (0, prelude_1.calculateStrength)(pwd, filteredCriteria);
            return [pwd, filteredCriteria, recalculatedStrength];
    }
};
exports.update = update;
//# sourceMappingURL=solution.js.map