const distance = require('jaro-winkler');

const scoreObject = {
    score: 0,
    substringMultiplier: 1,
    substringAddition: 1,
    bonusPoints: 1,
    distanceScore: 1,
    multiplier: 0
}

function updateScoreObject(length: number, factor: number) {
    scoreObject.multiplier = parseFloat(scoreObject.substringMultiplier.toString()) + ((scoreObject.substringMultiplier * length) * factor);
    scoreObject.bonusPoints = scoreObject.bonusPoints + scoreObject.substringAddition + (scoreObject.substringMultiplier * length);
    scoreObject.score = (scoreObject.distanceScore * scoreObject.bonusPoints * scoreObject.multiplier) / 5;
}

function calculateScores(slug: any, name: any, substringMultiplier = 1, substringAddition = 1) {
    name = name.replace('-', ' ');
    let nameArray = name.split(' ');
    let foundMatch = false;
    name = name.normalize('NFC');
    scoreObject.substringMultiplier = substringMultiplier;
    scoreObject.substringAddition = substringAddition;
    scoreObject.score = 0;
    scoreObject.bonusPoints = 0;
    scoreObject.distanceScore = distance(slug, name);

    name = name.split(' ').join('');
    const fullName = name;

    /* Check on: 
        -> Full name match with spaces removed (e.g. 'KevinKoobs' & 'Kevin Koobs') returns true
        -> Substring match (e.g. 'KevinK' & 'Kevin Koobs') returns 'KevinK'
        -> Per name match (e.g. 'KevinKoobs92' and ['Kevin', 'Koobs']) returns ['Kevin', 'Koobs']
        -> Every first letter of names (e.g. 'KevinK' & 'Kevin Koobs' or 'KKoobs' and 'Kevin Koobs') returns 'KevinK' or 'KKoobs'
    */

    if (slug === name) {
        // Full name match with spaces removed (e.g. 'KevinKoobs' & 'Kevin Koobs')
        updateScoreObject(fullName.length, 10)
        return scoreObject;
    }
    // Check if slug is firstname + lastname
    const firstNameAndLastName = nameArray[0] + nameArray[nameArray.length - 1];
    if (slug == firstNameAndLastName && !foundMatch) {
        updateScoreObject(fullName.length, 8);
        return scoreObject;
    }


    // Check for first letter in last name and/or first letter in first name in combination with first/lastname
    const firstLetterOfFirstNameAndLastName = nameArray[0].slice(0, 1) + nameArray[nameArray.length - 1];
    if (slug == firstLetterOfFirstNameAndLastName && !foundMatch) {
        updateScoreObject(name.length, 6);
        return scoreObject;
    }


    const firstNameAndFirstLetterOfLastName = nameArray[0] + nameArray[nameArray.length - 1].slice(0, 1);
    if (slug == firstNameAndFirstLetterOfLastName && !foundMatch) {
        updateScoreObject(fullName.length, 6);
        return scoreObject;
    }

    // Check if the slug equals one of the entered names but not only last name
    nameArray.map((name: string, index: number) => {
        if (name !== slug || index === nameArray.length - 1) return
        updateScoreObject(fullName.length, 4)
        return scoreObject
    })

    // Add every other name to the current name 
    // E.g. Name = William Jonathan Bracken, build 'WilliamJonathan', 'WilliamBracken', 'JonathanWilliam', 'JonathanBracken' etc.
    nameArray.map((name: string) => {
        nameArray.map((nameToAdd: string) => {
            let nameToTest = name + nameToAdd;

            if (name === nameToAdd) return;
            if (nameToTest !== slug) return;

            updateScoreObject(fullName.length, 3)
        })
        return scoreObject
    })


    // Check if any combination with the first letter of name and another name matches the slug
    // Note: There has to be at least one full name part
    // E.g.:
    // Name = William Jonathan Bracken
    // Award points for slugs 'WilliamJBracken', 'WJonathanBracken', 'WJBracken'
    // Do not award points for 'WJB', 'WillJBracken'

    // This checks for WJonathanBracken, WilliamJBracken and WilliamJonathanB
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildFullNameWithOneShortenedName(nameArray, name, index);
        if (slug !== newNameToCheck) return;

        updateScoreObject(fullName.length, 2)
        return scoreObject
    })

    // This checks for WJBracken, WilliamJB, WJonathanB
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildFullNameWithMultipleShortenedNames(nameArray, name, index);
        if (slug !== newNameToCheck) return;

        updateScoreObject(fullName.length, 2)
        return scoreObject
    })

    // This checks for WBracken, JBracken, WilliamJ, WilliamB, WJonathan, JonathanB
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildNameWithFirstLetterAndOneOtherName(nameArray, name, index);
        if (slug !== newNameToCheck) return;
        updateScoreObject(fullName.length, 2);
        return scoreObject;
    })

    // This checks for WillBracken, JohnBracken, WillJohnBracken (full name match + partial other names)
    nameArray.map((name: string, index: number) => {
        if (name.length < 3) return;

        if (slug.indexOf(name) !== -1) {
            nameArray.map((nameToCheckSubstringFor: string, indexOfNameToCheckSubstringFor: number) => {
                if (index === indexOfNameToCheckSubstringFor || name === nameToCheckSubstringFor) return;
                const compareSubstringsResult = compareSubstringOfNameToSlug(nameToCheckSubstringFor, slug);
                if (compareSubstringsResult && compareSubstringsResult.foundMatch === true) {
                    updateScoreObject(compareSubstringsResult.substringLength * 3, 2);
                    return scoreObject;
                }
            })
        }
        return scoreObject;
    })

    const compareSubstringsResult = compareSubstrings(name, slug)
    if (compareSubstringsResult?.foundMatch === true) {
        updateScoreObject(compareSubstringsResult?.substringLength, 8);
    }

    return scoreObject
}

function buildFullNameWithOneShortenedName(nameArray = [], name = '', index = 0) {
    if (nameArray.length === 0 || name === '') return;
    let firstLetter = name.slice(0, 1);
    let FullNameWithOneShortenedName: string[] = [firstLetter];
    nameArray.map((nameToAdd, indexOfNamesToAdd) => {
        if (index !== indexOfNamesToAdd) {
            FullNameWithOneShortenedName.splice(indexOfNamesToAdd, 0, nameToAdd);
        }
    })

    const FullNameWithOneShortenedNameAsString: string = FullNameWithOneShortenedName.join().replace(/[,]/g, '');

    return FullNameWithOneShortenedNameAsString;
}

function buildFullNameWithMultipleShortenedNames(nameArray = [], name = '', index = 0) {
    if (nameArray.length === 0 || name === '') return;

    let fullNameWithMultipleShortenedNames: string[] = [name];
    nameArray.map((nameToAdd: string, indexOfNamesToAdd: number) => {
        let firstLetter = nameToAdd.slice(0, 1)
        if (index !== indexOfNamesToAdd) {
            fullNameWithMultipleShortenedNames.splice(indexOfNamesToAdd, 0, firstLetter);
        }
    })
    const fullNameWithMultipleShortenedNamesAsString: string = fullNameWithMultipleShortenedNames.join().replace(/[,]/g, '');

    return fullNameWithMultipleShortenedNamesAsString;
}

function buildNameWithFirstLetterAndOneOtherName(nameArray = [], name = '', index = 0) {
    if (nameArray.length === 0 || name === '') return;

    const firstLetter = name.slice(0, 1);
    let nameWithFirstLetterAndOneOtherName = [firstLetter];
    nameArray.map((nameToAdd, indexOfNameToAdd) => {
        if (index !== indexOfNameToAdd) {
            nameWithFirstLetterAndOneOtherName.splice(indexOfNameToAdd, 0, nameToAdd);
        }
    })

    const nameWithFirstLetterAndOneOtherNameAsString: string = nameWithFirstLetterAndOneOtherName.join().replace(/[,]/g, '');
    return nameWithFirstLetterAndOneOtherNameAsString;
}

interface CompareSubstringsResult {
    foundMatch: boolean;
    substringLength: number;
}

function compareSubstrings(slug: string, name: string): CompareSubstringsResult {
    const shortestNameStringLength = name.length > slug.length ? slug.length : name.length;
    const shortestName = name.length > slug.length ? slug : name;
    const longestName = name.length > slug.length ? name : slug;
    const minSubstringLength = 3;
    let foundMatch = false;

    for (var substringLength = shortestNameStringLength; substringLength >= minSubstringLength; substringLength--) {
        for (let index: number = 0; index <= (longestName.length - substringLength); index++) {
            let substring = shortestName.toLowerCase().substr(index, substringLength);
            let result = longestName.toString().toLowerCase().indexOf(substring);
            if (result !== -1) {
                foundMatch = true;
                return {
                    foundMatch: true,
                    substringLength: substringLength
                };
            }
        }
    }

    if (!foundMatch) {
        for (var substringLength = 0; substringLength <= shortestNameStringLength; substringLength++) {
            for (let index: number = 0; index <= (longestName.length - substringLength); index++) {
                let substring = shortestName.toLowerCase().substr(index, substringLength);
                let result = longestName.toString().toLowerCase().indexOf(substring);
                if (result !== -1) {
                    foundMatch = true;
                    return {
                        foundMatch: true,
                        substringLength: substringLength
                    };
                }
            }
        }
    }

    return {
        foundMatch: false,
        substringLength: 0
    }
}

function compareSubstringOfNameToSlug(name: string, slug: string) {
    const minSubstringLength = 3;
    for (var substringLength = name.length; substringLength >= minSubstringLength; substringLength--) {
        let substring = name.toLowerCase().substr(0, substringLength);
        let result = slug.toString().toLowerCase().indexOf(substring);
        if (result !== -1) {
            return {
                foundMatch: true,
                substringLength: substringLength,
                substring: substring
            }
        }
    }
}

function compareSubstringFromName(name: string, slug: string) {
    const shortestNameStringLength = slug.length > name.length ? name.length : slug.length;
    const minSubstringLength = 3;

    for (var substringLength = shortestNameStringLength; substringLength >= minSubstringLength; substringLength--) {
        for (let index = 0; index <= (slug.length - substringLength); index++) {
            let substring = name.toLowerCase().substr(index, substringLength);
            if (substring.length >= minSubstringLength) return;
            let result = slug.toString().toLowerCase().indexOf(substring);
            if (result !== -1) {
                return {
                    foundMatch: true,
                    substringLength: substringLength,
                    substring: substring
                };
            }
        }
        return {
            foundMatch: false
        }
    }

}

export default function sanitizeInput(string1: string, string2: string, substringMultiplier: number, substringAddition: number) {
    string1 = string1.toLowerCase().replace(' ', '').replace(/[^a-z]/g, '');
    string2 = string2.toLowerCase();
    substringMultiplier = parseFloat(substringMultiplier.toString());
    substringAddition = parseFloat(substringAddition.toString());

    return {
        string1: string1,
        string2: string2,
        substringMultiplier: substringMultiplier,
        substringAddition: substringAddition
    }
}


function compareStrings(string1: string, string2: string, substringMultiplier: number = 1, substringAddition: number = 1) {
    const variables = sanitizeInput(string1, string2, substringMultiplier, substringAddition);
    const silentHMatch = /(?<=[aeiout]h)./gi;

    let scoreCalculation = calculateScores(variables.string1, variables.string2, variables.substringMultiplier, variables.substringAddition);
    if (scoreCalculation.score === 0) {
        // No score is returned yet. Try to get rid of a possible 'silent h' and check again
        const matchSilentH = silentHMatch.exec(variables.string2)
        if (matchSilentH !== null) {
            // There is a silent h in the name. Remove it and rerun tests
            let newName = variables.string2.substring(0, matchSilentH.index - 1) + variables.string2.substring(matchSilentH.index);
            scoreCalculation = calculateScores(variables.string1, newName, variables.substringMultiplier, variables.substringAddition);
        }
        // Let's do the same for the slug
        const matchSilentHSlug = silentHMatch.exec(variables.string1)
        if (matchSilentHSlug !== null) {
            // There is a silent h in the name. Remove it and rerun tests
            let newSlug = variables.string1.substring(0, matchSilentHSlug.index - 1) + variables.string1.substring(matchSilentHSlug.index);
            scoreCalculation = calculateScores(newSlug, variables.string2, variables.substringMultiplier, variables.substringAddition);
        }
    }

    return scoreCalculation;
}

module.exports = { compareStrings };