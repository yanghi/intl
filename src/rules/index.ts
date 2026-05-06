import noMixedPunctuation from './punctuation/no-mixed-punctuation';
import consistentScript from './script/consistent-script';
import noEmptyMessage from './no-empty-message';
import firstLetterUppercase from './letter/first-letter-uppercase';
import spaceBetweenCJKAndLatin from './letter/space-between-cjk-and-latin';

export const rules = [
    noMixedPunctuation,
    consistentScript,
    noEmptyMessage,
    firstLetterUppercase,
    spaceBetweenCJKAndLatin,
];

export const getRules = () => rules;
