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

## TODOS

- Add some code snippets.
- A better usage document.
- Add syntax definition for `.tm` and `.tr` files.
- Add icons for all wolfram language related file extensions.

Any issues or pull requests are welcomed!
