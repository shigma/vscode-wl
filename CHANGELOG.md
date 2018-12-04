# Change Log

## v1.3

- **Feature:** Some syntaxes are now treated as plugins.
- **Command:** `wolfram.generateSyntaxFile`: Generate syntax file.
- **Config:** `wolfram.syntax.xmlTemplate`: Support XML template syntax in special functions.
- **Config:** `wolfram.syntax.typeInference`: Support type inference in special functions.

## v1.2

- **Revert:** Remove declaration syntax.
- **Language:** Add supported extension `nbp`.
- **Syntax:** Embedded xml language support in `XMLTemplate`.
- **Syntax:** Fix coloring for some undocumented symbols.
- **Syntax:** Support nested expressions in strings.
- **Syntax:** Advanced coloring in different types of functions.
- **Syntax:** Support operator `//.` (ReplaceAll).
- **Enhance:** Add some detailed scope names including:
  - `variable.parameter.slot.wolfram` for slot parameters.
  - `constant.language.attribute.wolfram` for attribute names.
  - `variable.other.context.wolfram`, `entity.name.function.context.wolfram` and `support.function.context.wolfram` for contexts.

## v1.1

- **Feature:** Document display on hover and on completion.
- **Config:** Set default config `wordWrap` and `wordSeparators`.
- **Syntax:** Initial support for XML templates.
- **Syntax:** Support for function `Function` and `Compile`.
- **Syntax:** Support coloring for `\` before newlines.
- **Syntax:** Support operators `^=`, `^:=` and `=.`.
- **Syntax:** Fix unexpected behaviour when colorizing expressions like `SortBy[ func]`.
