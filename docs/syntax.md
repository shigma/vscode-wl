# Wolfram Language Syntax Overview

The page introduces the basic syntax of the wolfram language and explains the structure of the syntax files. [*src/syntaxes/simplest.yaml*](../src/syntaxes/simplest.yaml) is an implementation of this page.

## Glossary

There are some basic concepts in this overview. These regular expressions are called `variables` and will be auto inserted into the syntax files through [Mustache](https://en.wikipedia.org/wiki/Mustache_(template_system)) in the building process.

- *alnum:* `[0-9a-zA-Z]`
- *number:* `(?:\d+\.?|\.\d)\d*`
- *symbol:* `[$a-zA-Z]+[$0-9a-zA-Z]*`
- *identifier:* `` `?(?:{{symbol}}`)*{{symbol}}'``
- *escaped_character:* ``\\[ !"%&()*+/@\\^_`bfnrt<>]``
- *encoded_character:* `\\[0-7]{3}|\\\.[0-9A-Fa-f]{2}|\\:[0-9A-Fa-f]{4}`

### Escaped/Encoded Characters

In Wolfram Language, Some charcters can be "escaped" while others cannot. Try the following code on Mathematica:

```mathematica
Reap[
    Scan[
        Sow[#, Quiet @ Check[Length @ Characters @ ToExpression["\"\\" <> # <> "\""], -1]] &,
        CharacterRange[33, 126]
    ],
    _,
    #1 -> StringJoin[#2] &
] // Last
```

You can obtain the following result:

- disappeared: `<>`
- unchanged: `#$',-89;=?]{|}~`
- escaped: ``!"%&()*+/@\^_`bfnrt``
- errored: other characters

The first three kinds of characters can be placed after a `\` while characters from the last kind cannot.

The Wolfram Language also supports characters with encoding:

- 3-digits octal: `\\[0-7]{3}`
- 2-digits hexadecimal: `\\\.[0-9A-Fa-f]{2}`
- 4-digits hexadecimal: `\\:[0-9A-Fa-f]{4}`

Note that a string which begins with a `\`, `\.` or `\:` and followed by at least one number (or hexdecimal) character but don't matched with the syntax above is illegal.

Reference: [Input Syntax](https://reference.wolfram.com/language/tutorial/InputSyntax.html).

## Basic Structure

A simplest syntax definition for Wolfram Language support the following syntax:

- [Shebang](#Shebang)
- [Numbers](#Numbers)
- [Strings](#Strings)
- [Operators](#Operators)
- [Functions](#Functions)
- [Variables](#Variables)
- [Bracketing](#Bracketing)
- [Comment blocks](#Comment-blocks)
- [Shorthand expressions](#Shorthand-expressions)
- [Escaping before newlines](#Escaping-before-newlines)

### Shebang

See here for the [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) definition. It's easy to support such a syntax: `\A(#!).*(?=$)`.

### Numbers

In Wolfram Language, numbers can:

- have base: `2^^10`, `11^^a.a`
- have precision: ``2`10``, ``11` ``
- have accuracy: ```2``10```, ```11`` ```
- in scientific form: `2*^10`, `2*^-1.1`

So a complete syntax for number should be:

```regex
(?x)
(?:
  ([1-9]\d*\^\^)                                  # base
  ((?:{{alnum}}+\.?|\.{{alnum}}){{alnum}}*)       # value
  |
  ({{number}})                                    # value
)
(?:
  (\`\`(?:{{number}})?)                           # accuracy
  |
  (\`(?:{{number}})?)                             # precision
)?
(\*\^[+-]?{{number}})?                            # exponent
```

Note that `^^`, `` ` ``, ``` `` ``` and `*^` **SHOULD NOT** be treated as operators.

Reference: [Input Syntax](https://reference.wolfram.com/language/tutorial/InputSyntax.html).

### Strings

### Operators

### Functions

### Variables

### Bracketing

Reference: [TheFourKindsOfBracketingInTheWolframLanguage](https://reference.wolfram.com/language/tutorial/TheFourKindsOfBracketingInTheWolframLanguage.html).

### Comment blocks

A comment block is wrapped in a pair of `(*` and `*)`:

```yaml
begin: \(\*
end: \*\)
patterns:
  - include: '#comment-block'
```

Note that in the inner scope, a comment-block rule must also be included, because the following syntax is legal in Wolfram Language and can be found in some *.wl* files:

```mathematica
(* ::Input:: *)
(*(* some *)
(* comments *)*)
```

### Shorthand expressions

There are also some syntaxes which corresponds to a function but cannot be simply treated as operators.

- [Out](https://reference.wolfram.com/language/ref/Out.html): `%(\d*|%*)`
- [MessageName](https://reference.wolfram.com/language/ref/MessageName.html): `(::)\s*({{alnum}}+)`
- [Slot](https://reference.wolfram.com/language/ref/Slot.html): `(#[a-zA-Z]{{alnum}}*|#\d*)`
- [Get](https://reference.wolfram.com/language/ref/Get.html), [Put](https://reference.wolfram.com/language/ref/Put.html), [PutAppend](https://reference.wolfram.com/language/ref/PutAppend.html): ``(<<|>>>?) *([a-zA-Z0-9`/.!_:$*~?\\-]+) *(?=[\)\]\},;]|$)``

Reference: [Wolfram Language Syntax](https://reference.wolfram.com/language/guide/Syntax.html).

### Escaping before newlines

Finally, if a back-slash (`\\\r?\n`) is placed before a newline, it will eacape the newline.
