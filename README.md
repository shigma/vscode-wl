# Wolfram Language

[Wolfram Language](https://reference.wolfram.com/language) support for [Visual Studio Code](https://code.visualstudio.com/).

## Features

- All syntaxes from Wolfram Language.
- Updated documentations and completions.
- Color provider, diagnostics, ...

Demostration files can be seen under the *demo* folder.

### Supported Symbols

This extension uses specified crawler to get symbols and their usage from [Mathematica](http://www.wolfram.com/mathematica).

| Category | System Symbols | AddOns Symbols |
|:--------:|:--------------:|:--------------:|
| Function | 4169 | 953 |
| Constant | 437 | 1030 |
| Option | 973 | 260 |
| Undocumented | 611 | 408 |
| Total | 6190 | 2651 |

### Syntax Plugins

(*Invented in v1.3*) This extension also provided some syntax plugins which will enrich the coloring behaviour. These plugins can be found in settings:

- `wolfram.syntax.xmlTemplate`: Support XML template syntax in special functions (experimental).
- `wolfram.syntax.typeInference`: Support type inference in special functions. It uses recursive subpattern, which may cause regular expression denial of service, although it is not common.

Once configuration was changed, this extension will notify you to regenerate the syntax file. You can also use command `wolfram.generateSyntaxFile` to generate syntax file.

### Simplest Mode

(*Invented in v1.4*) If you don't like the coloring for built-in symbols, or if you find a coloring problem in some files and don't know what caused the problem, please have a look at the simplest mode. Set `wolfram.syntax.simplestMode` to `true`, the extension will regenerate the simplest syntax definitions for you.

| Syntax Package | Minified Size |
|:--------------:|:-------------:|
| Simplest Mode | 8.46 KB |
| Basic Syntax | 226.63 KB |
| Type Inference Plugin | 36.17 KB |
| XML Template Plugin | 29.86 KB |

We also provide a well-commented [source file](src/syntaxes/simplest.yaml) and a [syntax overview](docs/syntax-overview.md) for the simplest mode.

## Documentations

- [Syntax Overview for Wolfram Language](docs/syntax-overview.md)
- [Extended YAML Schema for Syntax Definitions](docs/yaml-schema.md)

## TODOS

- Add some code snippets.
- A better usage document.
- Add syntax definition for `.tm` and `.tr` files.
- Add icons for all wolfram language related file extensions.

Any issues or pull requests are welcomed!
