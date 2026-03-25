"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStringParam = extractStringParam;
exports.extractNumberParam = extractNumberParam;
exports.extractBooleanParam = extractBooleanParam;
function extractStringParam(param) {
    if (param === undefined || param === null) {
        return undefined;
    }
    if (Array.isArray(param)) {
        if (param.length > 0) {
            const firstElement = param[0];
            if (typeof firstElement === 'string') {
                return firstElement;
            }
            else if (typeof firstElement === 'object') {
                return JSON.stringify(firstElement);
            }
        }
        return undefined;
    }
    if (typeof param === 'string') {
        return param;
    }
    else if (typeof param === 'object') {
        return JSON.stringify(param);
    }
    return undefined;
}
function extractNumberParam(param) {
    const strValue = extractStringParam(param);
    if (strValue === undefined) {
        return undefined;
    }
    if (strValue.startsWith('{') && strValue.endsWith('}')) {
        try {
            const parsed = JSON.parse(strValue);
            if (parsed.id !== undefined) {
                const numValue = parseInt(parsed.id);
                return isNaN(numValue) ? undefined : numValue;
            }
            return undefined;
        }
        catch (e) {
            return undefined;
        }
    }
    const numValue = parseInt(strValue);
    return isNaN(numValue) ? undefined : numValue;
}
function extractBooleanParam(param) {
    const strValue = extractStringParam(param);
    if (strValue === undefined) {
        return undefined;
    }
    return strValue.toLowerCase() === 'true' || strValue === '1';
}
//# sourceMappingURL=query-param.util.js.map