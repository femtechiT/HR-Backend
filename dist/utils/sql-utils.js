"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlSafe = sqlSafe;
exports.sqlSafeNullable = sqlSafeNullable;
function sqlSafe(value) {
    return value === undefined ? null : value;
}
function sqlSafeNullable(value) {
    return value === undefined ? null : value;
}
//# sourceMappingURL=sql-utils.js.map