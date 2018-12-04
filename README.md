# Wolfram Language

Wolfram Language support for Visual Studio Code.

## Basic Features

- All syntaxes from Wolfram Language.
- Updated documentations and completions.

Demostration files can be seen under the *demo* folder.

### Syntax Plugins 

*Invented in v1.3.* This extension also provided some syntax plugins which will enrich the coloring behaviour. These plugins can be found in settings:

- wolfram.syntax.xmlTemplate: Support XML template syntax in special functions (experimental).
- wolfram.syntax.typeInference: Support type inference in special functions. It uses recursive subpattern, which may cause regular expression denial of service, although it is not common.

Once configuration was changed, this extension will notify you to regenerate the syntax file. You can also use command `wolfram.generateSyntaxFile` to generate syntax file.
