const ZeroCharCode = "0".charCodeAt(0);
const OneCharCode = "1".charCodeAt(0);
const NineCharCode = "9".charCodeAt(0);
// [\f\n\r\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]
const isWhitespace = (char) => {
    const code = char.charCodeAt(0);
    const whitespaces = [
        "\f",
        "\n",
        "\r",
        "\t",
        "\v",
        "\u0020",
        "\u00a0",
        "\u1680",
        "\u2028",
        "\u2029",
        "\u202f",
        "\u205f",
        "\u3000",
        "\ufeff",
    ];
    return whitespaces.includes(char) || (code >= 0x2000 && code <= 0x200a);
};
const isDigitNoZero = (char) => {
    const code = char.charCodeAt(0);
    return code >= OneCharCode && code <= NineCharCode;
};
const isDigit = (char) => {
    const code = char.charCodeAt(0);
    return code >= ZeroCharCode && code <= NineCharCode;
};
class Machine {
    text;
    offset;
    start;
    constructor(text, offset) {
        this.text = text;
        this.offset = offset;
        this.text = text;
        this.offset = offset;
        this.start = offset;
    }
    get char() {
        return this.text.charAt(this.offset);
    }
    get eof() {
        return this.offset >= this.text.length;
    }
    advance() {
        this.offset++;
    }
    eat(char) {
        if (this.char !== char) {
            if (this.eof) {
                throw new Error(`expected ${char} but got end of file at ${this.offset}`);
            }
            throw new Error(`expected ${char} but got ${this.char} at ${this.offset}`);
        }
        this.advance();
    }
    parse() {
        throw new Error("not implemented");
    }
    advanceNode(node) {
        this.offset = node.end;
        return node;
    }
    parseString() {
        return this.advanceNode(new StringMachine(this.text, this.offset).parse());
    }
    parseNumber() {
        return this.advanceNode(new NumberMachine(this.text, this.offset).parse());
    }
    parseObject() {
        return this.advanceNode(new ObjectMachine(this.text, this.offset).parse());
    }
    parseArray() {
        return this.advanceNode(new ArrayMachine(this.text, this.offset).parse());
    }
    parseBoolean() {
        return this.advanceNode(new BooleanMachine(this.text, this.offset).parse());
    }
    parseNull() {
        return this.advanceNode(new NullMachine(this.text, this.offset).parse());
    }
    isValueChar() {
        return (this.char === "{" ||
            this.char === "[" ||
            this.char === '"' ||
            this.char === "-" ||
            this.char === "t" ||
            this.char === "f" ||
            this.char === "n" ||
            isDigit(this.char));
    }
    parseValue() {
        let val;
        this.skipWhitespace();
        if (this.char === "{") {
            val = this.advanceNode(this.parseObject());
        }
        else if (this.char === "[") {
            val = this.advanceNode(this.parseArray());
        }
        else if (this.char === '"') {
            val = this.advanceNode(this.parseString());
        }
        else if (this.char === "-" || isDigit(this.char)) {
            val = this.advanceNode(this.parseNumber());
        }
        else if (this.char === "t" || this.char === "f") {
            val = this.advanceNode(this.parseBoolean());
        }
        else if (this.char === "n") {
            val = this.advanceNode(this.parseNull());
        }
        else {
            throw new Error("invalid value");
        }
        this.skipWhitespace();
        return val;
    }
    skipWhitespace() {
        while (isWhitespace(this.char)) {
            this.advance();
        }
    }
}
class JsonMachine extends Machine {
    parse() {
        const value = this.parseValue();
        if (!this.eof) {
            throw new Error(`unexpected character at ${this.offset}`);
        }
        return value;
    }
}
class StringMachine extends Machine {
    content;
    constructor(text, offset) {
        super(text, offset);
        this.content = "";
    }
    parse() {
        this.eat('"');
        this.parseStringContent();
        this.eat('"');
        return this.emit();
    }
    emit() {
        return {
            type: "string",
            start: this.start,
            end: this.offset,
            content: this.content,
        };
    }
    parseStringContent() {
        while (true) {
            if (this.char === '"') {
                break;
            }
            else if (this.char === "\\") {
                this.advance();
                this.parseStringEscape();
            }
            else if (this.eof) {
                throw new Error("unterminated string");
            }
            else {
                this.content += this.char;
                this.advance();
            }
        }
    }
    parseStringEscape() {
        switch (this.char) {
            case '"':
                this.content += '"';
                this.advance();
                break;
            case "\\":
                this.content += "\\";
                this.advance();
                break;
            case "/":
                this.content += "/";
                this.advance();
                break;
            case "b":
                this.content += "\b";
                this.advance();
                break;
            case "f":
                this.content += "\f";
                this.advance();
                break;
            case "n":
                this.content += "\n";
                this.advance();
                break;
            case "r":
                this.content += "\r";
                this.advance();
                break;
            case "t":
                this.content += "\t";
                this.advance();
                break;
            case "u":
                this.advance();
                this.content += this.parseUnicodeEscape();
                break;
            default:
                throw new Error(`invalid escape character: ${this.char}`);
        }
    }
    parseUnicodeEscape() {
        const isHex = (char) => {
            const code = char.charCodeAt(0);
            return ((code >= "0".charCodeAt(0) && code <= "9".charCodeAt(0)) ||
                (code >= "a".charCodeAt(0) && code <= "f".charCodeAt(0)) ||
                (code >= "A".charCodeAt(0) && code <= "F".charCodeAt(0)));
        };
        let hex = "";
        for (let i = 0; i < 4; i++) {
            if (!isHex(this.char)) {
                throw new Error(`invalid unicode escape: ${this.char}`);
            }
            hex += this.char;
            this.advance();
        }
        return String.fromCharCode(parseInt(hex, 16));
    }
}
class NumberMachine extends Machine {
    negative;
    integer;
    fraction;
    exponentNegative;
    exponent;
    constructor(text, offset) {
        super(text, offset);
        this.negative = false;
        this.integer = "";
        this.fraction = "";
        this.exponentNegative = false;
        this.exponent = "";
    }
    parse() {
        if (this.char === "-") {
            this.negative = true;
            this.advance();
        }
        this.parseIntegerPart();
        this.parseFractionalPart();
        this.parseExponentPart();
        return this.emit();
    }
    emit() {
        return {
            type: "number",
            start: this.start,
            end: this.offset,
            negative: this.negative,
            integer: this.integer,
            fraction: this.fraction,
            exponentNegative: this.exponentNegative,
            exponent: this.exponent,
        };
    }
    parseIntegerPart() {
        if (this.char === "0") {
            this.integer += this.char;
            this.advance();
        }
        else if (isDigitNoZero(this.char)) {
            this.integer += this.char;
            this.advance();
            this.integer += this.parseDigits();
        }
        else {
            throw new Error("invalid number");
        }
    }
    parseFractionalPart() {
        if (this.char === ".") {
            this.advance();
            if (isDigit(this.char)) {
                this.fraction = this.parseDigits();
            }
            else {
                throw new Error("invalid fractional parameter");
            }
        }
    }
    parseExponentPart() {
        const char = this.char;
        if (char !== "e" && char !== "E")
            return;
        this.advance();
        if (this.char === "-") {
            this.exponentNegative = true;
            this.advance();
        }
        else if (this.char === "+") {
            this.advance();
        }
        if (isDigit(this.char)) {
            this.exponent = this.parseDigits();
        }
        else {
            throw new Error("invalid exponent parameter");
        }
    }
    parseDigits() {
        const begin = this.offset;
        while (isDigit(this.char)) {
            this.advance();
        }
        return this.text.slice(begin, this.offset);
    }
}
class ObjectMachine extends Machine {
    properties;
    constructor(text, offset) {
        super(text, offset);
        this.properties = [];
    }
    parse() {
        this.eat("{");
        this.skipWhitespace();
        if (this.char === '"') {
            this.parseObjectContent();
        }
        this.eat("}");
        return this.emit();
    }
    emit() {
        return {
            type: "object",
            start: this.start,
            end: this.offset,
            properties: this.properties,
        };
    }
    parseObjectContent() {
        while (true) {
            this.parseObjectPropertyItem();
            if (this.char === "}")
                return;
            this.eat(",");
            this.skipWhitespace();
        }
    }
    parseObjectPropertyItem() {
        const begin = this.offset;
        const property = this.parseString();
        this.skipWhitespace();
        this.eat(":");
        const value = this.parseValue();
        this.properties.push({
            type: "property",
            key: property,
            value,
            start: begin,
            end: this.offset,
        });
    }
}
class ArrayMachine extends Machine {
    elements;
    constructor(text, offset) {
        super(text, offset);
        this.elements = [];
    }
    parse() {
        this.eat("[");
        this.skipWhitespace();
        if (this.isValueChar()) {
            this.parseArrayContent();
        }
        this.eat("]");
        return this.emit();
    }
    emit() {
        return {
            type: "array",
            start: this.start,
            end: this.offset,
            elements: this.elements,
        };
    }
    parseArrayContent() {
        while (true) {
            this.elements.push(this.parseValue());
            if (this.char !== ",") {
                break;
            }
            this.advance();
        }
    }
}
class BooleanMachine extends Machine {
    parse() {
        let value = false;
        if (this.char === "t") {
            this.advance();
            this.eat("r");
            this.eat("u");
            this.eat("e");
            value = true;
        }
        else if (this.char === "f") {
            this.advance();
            this.eat("a");
            this.eat("l");
            this.eat("s");
            this.eat("e");
        }
        else {
            throw new Error("invalid boolean");
        }
        return this.emit(value);
    }
    emit(value) {
        return {
            type: "boolean",
            start: this.start,
            end: this.offset,
            value,
        };
    }
}
class NullMachine extends Machine {
    parse() {
        this.eat("n");
        this.eat("u");
        this.eat("l");
        this.eat("l");
        return this.emit();
    }
    emit() {
        return {
            type: "null",
            start: this.start,
            end: this.offset,
        };
    }
}
export const astToValue = (ast) => {
    switch (ast.type) {
        case "boolean":
            return ast.value;
        case "null":
            return null;
        case "string":
            return ast.content;
        case "number": {
            let numStr = ast.negative ? "-" : "";
            numStr += ast.integer;
            if (ast.fraction) {
                numStr += "." + ast.fraction;
            }
            if (ast.exponent) {
                numStr += "e" + (ast.exponentNegative ? "-" : "") + ast.exponent;
            }
            return Number(numStr);
        }
        case "object":
            return Object.fromEntries(ast.properties.map((property) => [
                property.key.content,
                astToValue(property.value),
            ]));
        case "array":
            return ast.elements.map((element) => astToValue(element));
        default:
            throw new Error(`unknown ast type: ${ast.type}`);
    }
};
export const traverse = (node, fn) => {
    const traverseImpl = (node, fn, paths) => {
        if (fn({ node, paths }) === false)
            return;
        if (node.type === "object") {
            for (const property of node.properties) {
                traverseImpl(property, fn, [...paths, {
                        node,
                        property: property.key.content,
                    }]);
                traverseImpl(property.value, fn, [...paths, {
                        node,
                        property: property.key.content,
                    }]);
            }
        }
        if (node.type === "array") {
            for (let i = 0; i < node.elements.length; i++) {
                traverseImpl(node.elements[i], fn, [...paths, { property: i, node }]);
            }
        }
    };
    traverseImpl(node, fn, []);
};
export const parse = (text) => new JsonMachine(text, 0).parse();
