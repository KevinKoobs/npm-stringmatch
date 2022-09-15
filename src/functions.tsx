const distance = require('jaro-winkler');

const scoreObject = {
    score: 0,
    substringMultiplier: 1,
    substringAddition: 1,
    bonusPoints: 1,
    distanceScore: 1,
    multiplier: 0
}

function updateScoreObject(length: any, factor: any) {
    scoreObject.multiplier = parseFloat(scoreObject.substringMultiplier.toString()) + ((scoreObject.substringMultiplier * parseInt(length)) * parseInt(factor));
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

    console.log('-----------');
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


    console.log('Checking firstLetterOfFirstNameAndLastName');
    // Check for first letter in last name and/or first letter in first name in combination with first/lastname
    const firstLetterOfFirstNameAndLastName = nameArray[0].slice(0, 1) + nameArray[nameArray.length - 1];
    if (slug == firstLetterOfFirstNameAndLastName && !foundMatch) {
        updateScoreObject(name.length, 6);
        return scoreObject;
    }

    console.log('Checking firstNameAndFirstLetterOfLastName');

    const firstNameAndFirstLetterOfLastName = nameArray[0] + nameArray[nameArray.length - 1].slice(0, 1);
    if (slug == firstNameAndFirstLetterOfLastName && !foundMatch) {
        updateScoreObject(fullName.length, 6);
        return scoreObject;
    }

    // Check if the slug equals one of the entered names but not only last name
    console.log('Checking William');
    nameArray.map((name: string, index: number) => {
        if (name !== slug || index === nameArray.length - 1) return
        updateScoreObject(fullName.length, 4)
        return scoreObject
    })

    // Add every other name to the current name 
    // E.g. Name = William Jonathan Bracken, build 'WilliamJonathan', 'WilliamBracken', 'JonathanWilliam', 'JonathanBracken' etc.
    console.log('Checking WilliamBracken');
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
    console.log('Checking WJonathanBracken');
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildFullNameWithOneShortenedName(nameArray, name, index);
        if (slug !== newNameToCheck) return;

        updateScoreObject(fullName.length, 2)
        return scoreObject
    })

    // This checks for WJBracken, WilliamJB, WJonathanB
    console.log('Checking WJBracken');
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildFullNameWithMultipleShortenedNames(nameArray, name, index);
        if (slug !== newNameToCheck) return;

        updateScoreObject(fullName.length, 2)
        return scoreObject
    })

    // This checks for WBracken, JBracken, WilliamJ, WilliamB, WJonathan, JonathanB
    console.log('Checking WBracken');
    nameArray.map((name: string, index: number) => {
        let newNameToCheck = buildNameWithFirstLetterAndOneOtherName(nameArray, name, index);
        if (slug !== newNameToCheck) return;
        updateScoreObject(fullName.length, 2);
        return scoreObject;
    })

    // This checks for WillBracken, JohnBracken, WillJohnBracken (full name match + partial other names)
    console.log('Checking WillBracken');
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

    /* Situations that need to pass but don't right now
        SubstringMultiplier = 0.3
        SubstringAddition = 0.75
        Threshold = 2.5

        Name                            Slug                    Score
        Aaron Randolph Love             LoveA1                  0.33508
        Johnny Alexander Duarte         DuarteJohnnyA           0.54638
        Ren Carlo Ortiz Luis Dizon      Rcdizon                 0.55708
        Dayo Peter Olaogun              OlaogunD                0.49074
        Gerardo Montes Nunez            GerardNunez             0.89181
        James Andrew Turner             Turnerja                0.49605
        Paul Fragala                    FragalaP                0.70039
        Rudwaan Wharwood Abdul Raheem   R. Wharwood             0.65900
        Rudwaan Wharwood Abdul Raheem   Rudwaan. W              0.85517
        Rafael Alberto Figuora Faria    Rafigueroa              0.66494
        Rafael Alberto Figuora Faria    RGigueroa               0.48563
    */

    // Ignore possible silent 'h' /(.{1,})[aeiou]h(.{1,})/g, '\\1\\2'

    /* Situations that might pass, need feedback
        Name                        Slug            Score
        Carrie Lynn Guthrie         CarrieL         0.87368
        Russel Eugene Jenkins       RussJenkins     0.65151
        Jonathan James May          JonMay          0.63703
        David Armijo                David R. Armijo 0.94848
    */

    /*
        Situations that pass, but might not be good
        Name                                Slug            Score
        Oswald Anwar Crisologo Hellemun     Hellemun        2.86301
    */

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

function compareSubstrings(slug: string, name: string) {
    const shortestNameStringLength = name.length > name.length ? name.length : name.length;
    const minSubstringLength = 3;

    for (var substringLength = shortestNameStringLength; substringLength >= minSubstringLength; substringLength--) {
        for (let index: number = 0; index <= (name.length - substringLength); index++) {
            let substring = slug.toLowerCase().substr(index, substringLength);
            let result = name.toString().toLowerCase().indexOf(substring);
            if (result !== -1) {
                return {
                    foundMatch: true,
                    substringLength: substringLength
                };
            }
        }
        return {
            foundMatch: false
        }
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

export function sanitizeInput(slug1: string, slug2: string, substringMultiplier: number, substringAddition: number) {
    slug1 = slug1.toLowerCase().replace(' ', '').replace(/[^a-z]/g, '');
    slug2 = slug2.toLowerCase().replace(' ', '').replace(/[^a-z]/g, '');
    substringMultiplier = parseFloat(substringMultiplier.toString());
    substringAddition = parseFloat(substringAddition.toString());

    return {
        slug1: slug1,
        slug2: slug2,
        substringMultiplier: substringMultiplier,
        substringAddition: substringAddition
    }
}

module.exports = { compareSubstrings, calculateScores, sanitizeInput };