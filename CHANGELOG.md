# Change Log

## v1.4

- **Feature:** Support coloring and documentation for symbols from official addons.

## v1.3

- **Feature:** Some syntaxes are now treated as plugins.
- **Command:** `wolfram.generateSyntaxFile`: Generate syntax file.
- **Config:** `wolfram.syntax.xmlTemplate`: Support XML template syntax in special functions.
- **Config:** `wolfram.syntax.typeInference`: Support type inference in special functions.
- **Syntax:** [#4](https://github.com/Shigma/vscode-wl/issues/4) Fix unexpected behaviour when colorizing expressions after Get/Put/PutAppend.
- **Enhance:** Add some detailed scope names including:
  - `.context.wolfram` suffix for `constant.language`, `constant.numeric`, `support.undocumented` and `variable.parameter.option`.

## v1.2

- **Revert:** Remove declaration syntax.
- **Language:** Add supported extension `nbp`.
- **Syntax:** Embedded xml language support in `XMLTemplate`.
- **Syntax:** Fix coloring for some undocumented symbols.
- **Syntax:** Support nested expressions in strings.
- **Syntax:** Advanced coloring in different types of functions.
- **Syntax:** [#3](https://github.com/Shigma/vscode-wl/issues/3) Support operator `//.` (ReplaceAll).
- **Enhance:** [#3](https://github.com/Shigma/vscode-wl/issues/3) Add some detailed scope names including:
  - `variable.parameter.slot.wolfram` for slot parameters.
  - `constant.language.attribute.wolfram` for attribute names.
  - `.context.wolfram` suffix for `variable.other`, `entity.name.function` and `support.function`.

## v1.1

- **Feature:** Document display on hover and on completion.
- **Config:** Set default config `wordWrap` and `wordSeparators`.
- **Syntax:** Initial support for XML templates.
- **Syntax:** Support for function `Function` and `Compile`.
- **Syntax:** Support coloring for `\` before newlines.
- **Syntax:** Support operators `^=`, `^:=` and `=.`.
- **Syntax:** Fix unexpected behaviour when colorizing expressions like `SortBy[ func]`.
