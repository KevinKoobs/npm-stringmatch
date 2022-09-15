import { sanitizeInput } from './functions';

function compareStrings(string1: string, string2: string, substringMultiplier: number = 1, substringAddition: number = 1) {
    const variables = sanitizeInput(string1, string2, substringMultiplier, substringAddition);
}

module.exports = compareStrings;