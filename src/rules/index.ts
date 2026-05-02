import noMixedPunctuation from './punctuation/no-mixed-punctuation';
import consistentScript from './script/consistent-script';

export const rules = [
    noMixedPunctuation,
    consistentScript,
];

export const getRules = () => rules;
