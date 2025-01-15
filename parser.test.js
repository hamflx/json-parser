import { astToValue, parse } from "./parser.js";

describe("JSON Parser", () => {
  const parseValue = (input) => astToValue(parse(input));

  describe("Numbers", () => {
    test("parses integer", () => {
      expect(parseValue("123")).toBe(123);
      expect(parseValue("-123")).toBe(-123);
      expect(parseValue("0")).toBe(0);
    });

    test("parses floating point numbers", () => {
      expect(parseValue("123.456")).toBe(123.456);
      expect(parseValue("-123.456")).toBe(-123.456);
      expect(parseValue("0.123")).toBe(0.123);
    });

    test("parses numbers with exponents", () => {
      expect(parseValue("123e4")).toBe(123e4);
      expect(parseValue("123.456e-7")).toBe(123.456e-7);
      expect(parseValue("-123.456E+2")).toBe(-123.456E+2);
    });

    test("throws on invalid numbers", () => {
      expect(() => parseValue("01")).toThrow();
      expect(() => parseValue(".")).toThrow();
      expect(() => parseValue("1.")).toThrow();
      expect(() => parseValue("1e")).toThrow();
      expect(() => parseValue("1e-")).toThrow();
    });
  });

  describe("Strings", () => {
    test("parses simple strings", () => {
      expect(parseValue('"hello"')).toBe("hello");
      expect(parseValue('""')).toBe("");
    });

    test("parses escaped characters", () => {
      expect(parseValue('"\\""')).toBe('"');
      expect(parseValue('"\\\\"')).toBe("\\");
      expect(parseValue('"\\n"')).toBe("\n");
      expect(parseValue('"\\r"')).toBe("\r");
      expect(parseValue('"\\t"')).toBe("\t");
      expect(parseValue('"\\b"')).toBe("\b");
      expect(parseValue('"\\f"')).toBe("\f");
    });

    test("parses unicode escapes", () => {
      expect(parseValue('"\\u0061"')).toBe("a");
      expect(parseValue('"\\u00A9"')).toBe("©");
    });

    test("throws on invalid strings", () => {
      expect(() => parseValue('"')).toThrow();
      expect(() => parseValue('"\\u"')).toThrow();
      expect(() => parseValue('"\\u123"')).toThrow();
      expect(() => parseValue('"\\x"')).toThrow();
    });
  });

  describe("Arrays", () => {
    test("parses empty arrays", () => {
      expect(parseValue("[]")).toEqual([]);
    });

    test("parses arrays with single values", () => {
      expect(parseValue("[1]")).toEqual([1]);
      expect(parseValue('["test"]')).toEqual(["test"]);
    });

    test("parses arrays with multiple values", () => {
      expect(parseValue("[1,2,3]")).toEqual([1, 2, 3]);
      expect(parseValue('[1,"test",3]')).toEqual([1, "test", 3]);
    });

    test("parses nested arrays", () => {
      expect(parseValue("[[1,2],[3,4]]")).toEqual([[1, 2], [3, 4]]);
    });

    test("throws on invalid arrays", () => {
      expect(() => parseValue("[")).toThrow();
      expect(() => parseValue("[,")).toThrow();
      expect(() => parseValue("[1,]")).toThrow();
      expect(() => parseValue("[1 2]")).toThrow();
    });
  });

  describe("Objects", () => {
    test("parses empty objects", () => {
      expect(parseValue("{}")).toEqual({});
    });

    test("parses simple objects", () => {
      expect(parseValue('{"a":1}')).toEqual({ a: 1 });
      expect(parseValue('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
    });

    test("parses objects with different value types", () => {
      expect(parseValue('{"str":"test","num":123,"arr":[1,2]}')).toEqual({
        str: "test",
        num: 123,
        arr: [1, 2],
      });
    });

    test("parses nested objects", () => {
      expect(parseValue('{"a":{"b":{"c":3}}}')).toEqual({ a: { b: { c: 3 } } });
    });

    test("throws on invalid objects", () => {
      expect(() => parseValue("{")).toThrow();
      expect(() => parseValue('{"a"}')).toThrow();
      expect(() => parseValue('{"a":1,}')).toThrow();
      expect(() => parseValue("{a:1}")).toThrow();
    });
  });

  describe("Complex JSON", () => {
    test("parses complex nested structures", () => {
      const input = `{
        "name": "Test",
        "numbers": [1,2,3],
        "nested": {
          "array": [[1,2], [3,4]],
          "object": {"a":1, "b":2}
        },
        "unicode": "\\u0061\\u0062\\u0063"
      }`;

      expect(parseValue(input)).toEqual({
        name: "Test",
        numbers: [1, 2, 3],
        nested: {
          array: [[1, 2], [3, 4]],
          object: { a: 1, b: 2 },
        },
        unicode: "abc",
      });
    });
  });

  describe("Whitespace handling", () => {
    test("handles various whitespace characters", () => {
      const input = `
      {
        "a" : 1,
        "b" :\t2,
        "c":\n3
      }`;
      expect(parseValue(input)).toEqual({ a: 1, b: 2, c: 3 });
    });
  });
});
