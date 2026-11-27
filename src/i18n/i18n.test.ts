import en from './en';
import fr from './fr';

describe('translations', () => {
  it('have the same keys and no empty text', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    for (const v of [...Object.values(fr), ...Object.values(en)]) expect(v.trim()).not.toBe('');
  });
  it('use typographic apostrophes in French', () => {
    for (const v of Object.values(fr)) expect(v).not.toContain("'");
  });
});
