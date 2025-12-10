import { describe, it, expect } from 'vitest';
import { cleanAndParseJSON } from '../services/geminiService';

describe('cleanAndParseJSON', () => {
  it('parses plain JSON string', () => {
    const s = '{"name":"Test","dataPoints":[[1,2],[3,4]]}';
    const res = cleanAndParseJSON(s);
    expect(res).toEqual({ name: 'Test', dataPoints: [[1,2],[3,4]] });
  });

  it('parses JSON inside ```json code block', () => {
    const s = 'Here is the data:\n```json\n{"name":"Block","dataPoints":[[1,2]]}\n```\nThanks';
    const res = cleanAndParseJSON(s);
    expect(res.name).toBe('Block');
  });

  it('parses JSON from first and last braces', () => {
    const s = 'Some header text {"name":"Brace","x":1} trailing text';
    const res = cleanAndParseJSON(s);
    expect(res.name).toBe('Brace');
  });

  it('throws when no JSON can be extracted', () => {
    expect(() => cleanAndParseJSON('no json here')).toThrow();
  });
});
