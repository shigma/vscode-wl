# Wolfram Language

[Wolfram Language](https://reference.wolfram.com/language) support for [Visual Studio Code](https://code.visualstudio.com/).

## Features

- All syntaxes from Wolfram Language.
- Updated documentations and completions.

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

(*Invented in v1.4*) If you don't like the coloring for built-in symbols, or if you want to learn the syntaxes definition quickly (the [*src/syntaxes/base.yaml*](src/syntaxes/base.yaml) may be difficult to understand), or if you find a coloring problem in some files and don't know what caused the problem, please have a look at the simplest mode. Set `wolfram.syntax.simplestMode` to `true`, the extension will auto regenerate the simplest syntax definitions for you. Here is a well-commented source file: [*src/syntaxes/simplest.yaml*](src/syntaxes/simplest.yaml).

## TODOS

- Add some code snippets.
- A better usage document.
- Add syntax definition for `.tm` and `.tr` files.
- Add icons for all wolfram language related file extensions.

Any issues or pull requests are welcomed!
