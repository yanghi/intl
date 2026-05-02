export function prettyString(str: string, maxLength: number = 10): string {
    if(str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
}

/**
 * 展示指定位置字符,并向前向后展示部分字符，向前和向后各取maxLength/2个字符，如果不足则取全部
 * pretty string in the middle of the string
 * @example prettyStringMid("1234567890", 4, 5) -> "34567"
 */
export function prettyStringPartialMid(str: string, start: number, maxLength: number = 10): string {
  const halfLength = Math.floor(maxLength / 2);
  return `${str.slice(start - halfLength, start)}${str.slice(start, start + halfLength)}`;
}