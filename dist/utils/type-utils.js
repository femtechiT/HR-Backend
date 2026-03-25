"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStringQueryParam = getStringQueryParam;
exports.getNumberQueryParam = getNumberQueryParam;
function getStringQueryParam(req, paramName, defaultValue) {
    const param = req.query[paramName];
    if (Array.isArray(param)) {
        return typeof param[0] === 'string' ? param[0] : defaultValue;
    }
    else if (typeof param === 'string') {
        return param;
    }
    return defaultValue;
}
function getNumberQueryParam(req, paramName, defaultValue = 0) {
    const stringValue = getStringQueryParam(req, paramName);
    if (stringValue === undefined) {
        return defaultValue;
    }
    const numValue = parseInt(stringValue, 10);
    return isNaN(numValue) ? defaultValue : numValue;
}
//# sourceMappingURL=type-utils.js.map