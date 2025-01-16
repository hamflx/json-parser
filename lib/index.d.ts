export type AstNode = AstNodeObject | AstNodeArray | AstNodeString | AstNodeNumber | AstNodeBoolean | AstNodeNull;
export interface AstNodeObject {
    type: "object";
    start: number;
    end: number;
    properties: AstNodeProperty[];
}
export interface AstNodeProperty {
    type: "property";
    key: AstNodeString;
    value: AstNode;
    start: number;
    end: number;
}
export interface AstNodeArray {
    type: "array";
    start: number;
    end: number;
    elements: AstNode[];
}
export interface AstNodeNumber {
    type: "number";
    start: number;
    end: number;
    negative: boolean;
    integer: string;
    fraction: string;
    exponentNegative: boolean;
    exponent: string;
}
export interface AstNodeBoolean {
    type: "boolean";
    start: number;
    end: number;
    value: boolean;
}
export interface AstNodeNull {
    type: "null";
    start: number;
    end: number;
}
export interface AstNodeString {
    type: "string";
    start: number;
    end: number;
    content: string;
}
export declare const astToValue: (ast: AstNode) => unknown;
export declare const traverse: (node: AstNode | AstNodeProperty, fn: (args: {
    node: AstNode | AstNodeProperty;
    paths: any[];
}) => boolean) => void;
export declare const parse: (text: string) => AstNode;
