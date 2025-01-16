# json-parser

一个用 TypeScript 实现的 JSON 解析器。

## 功能特点

- 完整支持 JSON 规范（也许吧）。
- 支持 AST（抽象语法树）输出。

## 使用方法

安装：

```bash
bun add @hamflx/json-parser
```

使用：

```typescript
import { parse, astToValue } from '@hamflx/json-parser';

// 解析 JSON 字符串为 AST
const ast = parse('{"name": "json-parser", "version": "0.0.1"}');

// 将 AST 转换为 JavaScript 值
const value = astToValue(ast);
```

## 许可证

MIT
