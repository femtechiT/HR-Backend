import { ParsedQs } from 'qs';

/**
 * Utility function to safely extract string values from Express query parameters
 * Handles both single values and arrays, returning the first element if it's an array
 */
export function extractStringParam(param: string | ParsedQs | (string | ParsedQs)[] | undefined | null): string | undefined {
  if (param === undefined || param === null) {
    return undefined;
  }

  if (Array.isArray(param)) {
    if (param.length > 0) {
      const firstElement = param[0];
      if (typeof firstElement === 'string') {
        return firstElement;
      } else if (typeof firstElement === 'object') {
        // If it's a ParsedQs object, convert to string representation
        return JSON.stringify(firstElement);
      }
    }
    return undefined;
  }

  if (typeof param === 'string') {
    return param;
  } else if (typeof param === 'object') {
    // If it's a ParsedQs object, convert to string representation
    return JSON.stringify(param);
  }

  return undefined;
}

/**
 * Utility function to safely extract number values from Express query parameters
 */
export function extractNumberParam(param: string | ParsedQs | (string | ParsedQs)[] | undefined | null): number | undefined {
  const strValue = extractStringParam(param);
  if (strValue === undefined) {
    return undefined;
  }

  // If the string is a JSON object (from ParsedQs), try to extract a meaningful value
  if (strValue.startsWith('{') && strValue.endsWith('}')) {
    try {
      const parsed = JSON.parse(strValue);
      // If the parsed object has an 'id' property, use that as the number
      if (parsed.id !== undefined) {
        const numValue = parseInt(parsed.id);
        return isNaN(numValue) ? undefined : numValue;
      }
      // Otherwise, return undefined
      return undefined;
    } catch (e) {
      // If parsing fails, return undefined
      return undefined;
    }
  }

  const numValue = parseInt(strValue);
  return isNaN(numValue) ? undefined : numValue;
}

/**
 * Utility function to safely extract boolean values from Express query parameters
 */
export function extractBooleanParam(param: string | ParsedQs | (string | ParsedQs)[] | undefined | null): boolean | undefined {
  const strValue = extractStringParam(param);
  if (strValue === undefined) {
    return undefined;
  }

  return strValue.toLowerCase() === 'true' || strValue === '1';
}