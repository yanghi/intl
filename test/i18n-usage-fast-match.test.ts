import { describe, expect, it } from 'vitest';
import { fastMatch } from '@/core/document/code/i18n-usage/fast-match';

const file = 'app.ts';

function match(code: string, t = ['t', 'this.t', '$t']) {
  return fastMatch({ filePath: file, code, t });
}

describe('fastMatch', () => {
  it('collects static single-quoted key', () => {
    const u = match("const x = t('a.b')");
    expect(u).toEqual([
      expect.objectContaining({ key: 'a.b', value: 'a.b', line: 1, column: 11 }),
    ]);
  });

  it('collects static double-quoted key with optional second argument', () => {
    const u = match('t("ns.msg", { locale: "en" })');
    expect(u).toEqual([expect.objectContaining({ key: 'ns.msg', value: 'ns.msg' })]);
  });

  it('collects this.t and $t with second argument', () => {
    const code = `
this.t('p', foo)
$x = $t("q", [1, (2)])
`;
    const u = fastMatch({ filePath: 'x.vue', code, t: ['this.t', '$t'] });
    expect(u.map((x) => x.key)).toEqual(['p', 'q']);
  });

  it('supports template literal key without interpolation', () => {
    const u = match('t(`plain.key`)');
    expect(u).toEqual([expect.objectContaining({ key: 'plain.key' })]);
  });

  it('unescapes common string escapes in key', () => {
    const u = match(String.raw`t('line\nbreak')`);
    expect(u[0]?.key).toBe('line\nbreak');
  });

  it('ignores dynamic first argument', () => {
    expect(match("t(dynamic)")).toEqual([]);
    expect(match('t(`a${b}`)')).toEqual([]);
  });

  it('ignores line-commented calls', () => {
    const code = `
    t('live')
    // t('dead1')
    x // t('dead2')
`;
    expect(match(code).map((x) => x.key)).toEqual(['live']);
  });

  it('ignores block-commented calls', () => {
    const code = `
    t('live')
    /* t('dead')
       multiline */
    /** t('dead3') */
`;
    expect(match(code).map((x) => x.key)).toEqual(['live']);
  });

  it('ignores usage after // on same line as live call', () => {
    const u = match("t('live') // t('dead')");
    expect(u.map((x) => x.key)).toEqual(['live']);
  });

  it('ignores HTML / Vue template comments', () => {
    const code = `
<template>
  <div>{{ t('live') }}</div>
  <!-- {{ $t('dead') }} -->
  <!-- t('dead2') -->
  <!--<div>
  {{ t('dead3') }}
   </div>-->
</template>
`;
    const u = fastMatch({ filePath: 'c.vue', code, t: ['t', '$t'] });
    expect(u.map((x) => x.key)).toEqual(['live']);
  });

  it('does not treat // inside string as comment when scanning', () => {
    const u = match("t('https://x.y/z')");
    expect(u).toEqual([expect.objectContaining({ key: 'https://x.y/z' })]);
  });

  it('handles second argument with nested parens and strings', () => {
    const u = match(String.raw`t('k', { x: foo(")", bar(')')) })`);
    expect(u).toEqual([expect.objectContaining({ key: 'k' })]);
  });

  it('does not match string concatenation as static key', () => {
    expect(match("t('a' + 'b')")).toEqual([]);
  });

  it('prefers longer callee names when overlapping', () => {
    const u = fastMatch({ filePath: file, code: "this.t('x')", t: ['t', 'this.t'] });
    expect(u).toHaveLength(1);
    expect(u[0]?.column).toBe(1);
    expect(u[0]?.key).toBe('x');
  });
});
