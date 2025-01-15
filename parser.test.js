const { JsonMachine, astToValue } = require('./parser');

describe('JSON Parser', () => {
  const parse = (input) => astToValue(new JsonMachine(input, 0).parse());

  describe('Numbers', () => {
    test('parses integer', () => {
      expect(parse('123')).toBe(123);
      expect(parse('-123')).toBe(-123);
      expect(parse('0')).toBe(0);
    });

    test('parses floating point numbers', () => {
      expect(parse('123.456')).toBe(123.456);
      expect(parse('-123.456')).toBe(-123.456);
      expect(parse('0.123')).toBe(0.123);
    });

    test('parses numbers with exponents', () => {
      expect(parse('123e4')).toBe(123e4);
      expect(parse('123.456e-7')).toBe(123.456e-7);
      expect(parse('-123.456E+2')).toBe(-123.456E+2);
    });

    test('throws on invalid numbers', () => {
      expect(() => parse('01')).toThrow();
      expect(() => parse('.')).toThrow();
      expect(() => parse('1.')).toThrow();
      expect(() => parse('1e')).toThrow();
      expect(() => parse('1e-')).toThrow();
    });
  });

  describe('Strings', () => {
    test('parses simple strings', () => {
      expect(parse('"hello"')).toBe('hello');
      expect(parse('""')).toBe('');
    });

    test('parses escaped characters', () => {
      expect(parse('"\\""')).toBe('"');
      expect(parse('"\\\\"')).toBe('\\');
      expect(parse('"\\n"')).toBe('\n');
      expect(parse('"\\r"')).toBe('\r');
      expect(parse('"\\t"')).toBe('\t');
      expect(parse('"\\b"')).toBe('\b');
      expect(parse('"\\f"')).toBe('\f');
    });

    test('parses unicode escapes', () => {
      expect(parse('"\\u0061"')).toBe('a');
      expect(parse('"\\u00A9"')).toBe('©');
    });

    test('throws on invalid strings', () => {
      expect(() => parse('"')).toThrow();
      expect(() => parse('"\\u"')).toThrow();
      expect(() => parse('"\\u123"')).toThrow();
      expect(() => parse('"\\x"')).toThrow();
    });
  });

  describe('Arrays', () => {
    test('parses empty arrays', () => {
      expect(parse('[]')).toEqual([]);
    });

    test('parses arrays with single values', () => {
      expect(parse('[1]')).toEqual([1]);
      expect(parse('["test"]')).toEqual(['test']);
    });

    test('parses arrays with multiple values', () => {
      expect(parse('[1,2,3]')).toEqual([1,2,3]);
      expect(parse('[1,"test",3]')).toEqual([1,'test',3]);
    });

    test('parses nested arrays', () => {
      expect(parse('[[1,2],[3,4]]')).toEqual([[1,2],[3,4]]);
    });

    test('throws on invalid arrays', () => {
      expect(() => parse('[')).toThrow();
      expect(() => parse('[,')).toThrow();
      expect(() => parse('[1,]')).toThrow();
      expect(() => parse('[1 2]')).toThrow();
    });
  });

  describe('Objects', () => {
    test('parses empty objects', () => {
      expect(parse('{}')).toEqual({});
    });

    test('parses simple objects', () => {
      expect(parse('{"a":1}')).toEqual({a:1});
      expect(parse('{"a":1,"b":2}')).toEqual({a:1,b:2});
    });

    test('parses objects with different value types', () => {
      expect(parse('{"str":"test","num":123,"arr":[1,2]}')).toEqual({
        str: 'test',
        num: 123,
        arr: [1,2]
      });
    });

    test('parses nested objects', () => {
      expect(parse('{"a":{"b":{"c":3}}}')).toEqual({a:{b:{c:3}}});
    });

    test('throws on invalid objects', () => {
      expect(() => parse('{')).toThrow();
      expect(() => parse('{"a"}')).toThrow();
      expect(() => parse('{"a":1,}')).toThrow();
      expect(() => parse('{a:1}')).toThrow();
    });
  });

  describe('Complex JSON', () => {
    test('parses complex nested structures', () => {
      const input = `{
        "name": "Test",
        "numbers": [1,2,3],
        "nested": {
          "array": [[1,2], [3,4]],
          "object": {"a":1, "b":2}
        },
        "unicode": "\\u0061\\u0062\\u0063"
      }`;
      
      expect(parse(input)).toEqual({
        name: 'Test',
        numbers: [1,2,3],
        nested: {
          array: [[1,2], [3,4]],
          object: {a:1, b:2}
        },
        unicode: 'abc'
      });
    });
  });

  describe('Whitespace handling', () => {
    test('handles various whitespace characters', () => {
      const input = `
      {
        "a" : 1,
        "b" :\t2,
        "c":\n3
      }`;
      expect(parse(input)).toEqual({a:1,b:2,c:3});
    });
  });
}); 