# Stringmatch

### **Description**
Package to compare two strings and build a score for the similarity between the two. Use it to match user names with real names for example.

The package relies on the [jaro-winkler](https://www.npmjs.com/package/jaro-winkler) package for a base calculation of distance between the two strings. After the calculation you can come up with an arbitrary threshold number to see if the strings match enough or one of them needs a change. 



### **Installation**
Just 
``` npm install @kevinkoobs/stringmatch```
to install the package.

### **Usage**
In simple .js-scripts import the package and run the only function available:
```js
const stringMatch = require('@kevinkoobs/stringmatch')
console.log(stringMatch.compareStrings('KevinKoobs', 'Kevin Koobs', 1, 1));
```

The function `compareStrings()` takes in four arguments. The first two are the strings you want to compare, the last two are the multiplier and addition. So the function looks like this:
```ts
compareSubstrings(string1: string, string2: string, substringMultiplier: number, substringAddition: number);
```
The multiplier and addition default to `1` and works as follows:

If there is a substring in one of the two strings that matches (part of) the other string, a bonus is rewarded and a multiplier is calculated. Both take in the length of the substring (minimum of 3) and a predefined factor, i.e. `2`. When a substring of 6 characters is found, the `substringMultiplier` will be multiplied by the length and the factor and added by `1`. For every character the `substringMultiplier` is also added to the `substringAddition` and the two numbers coming from those calculations are multiplied with the default `jaro-winkler` score. At last, that number is divided by 5 to remove excessive high numbers.

Example:

**input**
```ts
compareSubstrings('KevinKoobs', 'Kevin Koobs', 2.5, 1.5);
```
**output**
```ts
{
  score: 1325.625,
  substringMultiplier: 2.5,
  substringAddition: 1.25,
  bonusPoints: 26.25,
  distanceScore: 1,
  multiplier: 252.5
}
```

### **License**
[MIT](https://choosealicense.com/licenses/mit/)