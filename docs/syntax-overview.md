# Wolfram Language Syntax Overview

The page introduces the basic syntax of the wolfram language and explains the structure of the syntax files. [*src/syntaxes/simplest.yaml*](../src/syntaxes/simplest.yaml) is a direct implementation of this page.

Note: the syntax definition uses some [YAML tags](https://yaml.org/spec/1.2/spec.html#id2761292) which can be found in [*build/types*](../build/types).

## Glossary

There are some basic concepts in this overview. These regular expressions are called *variables* and will be auto inserted into the syntax files through [Mustache](https://en.wikipedia.org/wiki/Mustache_(template_system)) in the building process.

- *alnum:* `[0-9a-zA-Z]`
- *number:* `(?:\d+\.?|\.\d)\d*`
- *symbol:* `[$a-zA-Z]+[$0-9a-zA-Z]*`

## Basic Patterns

A simplest syntax definition for Wolfram Language support the following syntax:

- [Shebang](#Shebang)
- [Numbers](#Numbers)
- [Strings](#Strings)
- [Operators](#Operators)
- [Variables](#Variables)
- [Functions](#Functions)
- [Patterns](#Patterns)
- [Bracketing](#Bracketing)
- [Box Forms](#Box-forms)
- [Comment blocks](#Comment-blocks)
- [Shorthand expressions](#Shorthand-expressions)
- [Escaping before newlines](#Escaping-before-newlines)

### Shebang

See [here](https://en.wikipedia.org/wiki/Shebang_(Unix)) for the shebang definition. It's easy to support such a syntax: `\A(#!).*(?=$)`.

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

Note: `^^`, `` ` ``, ``` `` ``` and `*^` should not be treated as operators.

Reference: [Input Syntax](https://reference.wolfram.com/language/tutorial/InputSyntax.html).

### Strings

A string in Wolfram Language must be quoted in a pair of `"` and can have the following special syntaxes:

#### Named Characters

Some special characters may have their names, and can be matched with `\\\[{{alnum}}+\]`.

Note: not every `\\\[{{alnum}}+\]` is corrent grammar, but the simplest syntax definition does not provides a list of supported names.

#### Escaped Characters

In Wolfram Language, some charcters can be "escaped" while others cannot. Try the following code on Mathematica:

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

#### Encoded Characters

The Wolfram Language also supports characters with encoding:

- 3-digits octal: `\\[0-7]{3}`
- 2-digits hexadecimal: `\\\.[0-9A-Fa-f]{2}`
- 4-digits hexadecimal: `\\:[0-9A-Fa-f]{4}`

Note: a string which begins with a `\`, `\.` or `\:` and followed by at least one number (or hexdecimal) character but don't matched with the syntax above is illegal.

#### Embedded Box Forms

A string can also include [box forms](#box-forms) which will be introduced later on. But in the simplest syntax, box forms in string will not be supported.

References:
- [Input Syntax](https://reference.wolfram.com/language/tutorial/InputSyntax.html)
- [Special Characters](https://reference.wolfram.com/language/guide/SpecialCharacters.html)
- [Listing of Named Characters](https://reference.wolfram.com/language/guide/ListingOfNamedCharacters.html)
- [String Representation of Boxes](https://reference.wolfram.com/language/tutorial/StringRepresentationOfBoxes.html)

### Operators

There are so many operators in Wolfram Language! But syntax definitions for them is easy to write. You only need to check them out and write them in a proper sequence. I divided them into 15 categories:

```
Replace:
  /.    Replace
  //.   ReplaceAll

Call:
  @     Prefix
  @@    Apply
  @@@   Apply
  /@    Map
  //@   MapAll
  //    Postfix
  ~     Infix
  @*    Composition
  /*    RightComposition

Comparison:
  >     Greater
  <     Less
  >=    GreaterEqual
  <=    LessEqual
  ==    Equal
  !=    Unequal
  ===   SameQ
  =!=   UnsameQ

Logical:
  !     Not
  ||    Or
  &&    And

Assignment:
  =     Set
  :=    SetDelayed
  ^=    UpSet
  ^:=   UpSetDelayed
  /:    TagSet (TagUnset, TagSetDelayed)
  =.    Unset
  +=    AddTo
  -=    SubtractFrom
  *=    TimesBy
  /=    DivideBy

Rule:
  ->    Rule
  :>    RuleDelayed
  <->   TwoWayRule

Condition:
  /;    Condition

Repeat:
  ..    Repeated
  ...   RepeatedNull

Arithmetic:
  +     Plus
  -     Minus, Subtract
  *     Multiply
  /     Devide
  ^     Power
  .     Dot
  ++    Increment, PreIncrement
  --    Decrement, PreDecrement

Flow:
  <<    Get
  >>    Put
  >>>   PutAppend

String:
  <>    StringJoin
  ~~    StringExpression

Span:
  ;;    Span

Compound:
  ;     CompoundExpression

Function:
  &     Function

Definition:
  ?     Definition
  ??    FullDefinition
```

Note: Some operators may not be included in the list if they are declared in other scopes.

Also, [named characters](#Named-Characters) can also be recognized as operators.

Reference: [Operators](https://reference.wolfram.com/language/tutorial/Operators.html).

### Variables

A general variable is some symbols joined with some `` ` `` (a symbol before a `` ` `` is called "context").

```yaml
match: (`?(?:{{symbol}}`)*){{symbol}}
name: variable.other.wolfram
captures: !raw
  1: variable.other.context.wolfram
```

### Functions

Functions have no difference with variables in Wolfram Language. But we should color them more like functions in a syntax definition. Here are some basic way to identify a function:

- an variable placed before `(@{1,3}|//?@|[/@]\*)`
- an variable placed after `(//|[@/]\*)`
- an variable placed on an even order in some expressions joined with some `~`
- an variable placed after a PatternTest (which was introduced in the next part)

### Patterns

Apart from functions, patterns have two forms:

1. in the shorthand form of pattern, that is a variable before `:(?=[^:>=])`
2. in the shorthand form of blank and default, that is a variable before

```regex
(?x)
(_\.)               # Default
|
(_{1,3})            # Blank, BlankSequence, BlankNullSequence
({{identifier}})?   # Head (here "identifier" means variable)
```

After a pattern, there may be some additional syntaxes other than expressions:

- Optional: `:`
- PatternTest: `?`

However, how to color them properly is of great difficulty, and is not supposed to be discussed here.

### Bracketing

There are many kinds of bracketing in the Wolfram Language. A general bracketing rule should be like this:

```yaml
begin: \\(
beginCaptures: !all punctuation.section.parens.begin.wolfram
end: \\)
endCaptures: !all punctuation.section.parens.end.wolfram
name: meta.parens.wolfram
patterns: !push expressions
```

In a simplest syntax declaration, we only need to support the following bracketing:

- parens: `(` and `)`
- braces: `{` and `}`
- brackets: `[` and `]`
- association: `<|` and `|>`
- parts: `[[` and `]]`
- box: `\(` and `\)`

Reference: [The Four Kinds of Bracketing in the Wolfram Language](https://reference.wolfram.com/language/tutorial/TheFourKindsOfBracketingInTheWolframLanguage.html).

### Box Forms

Box forms is a nested scope with all expression rules and some special syntaxes:

- ``\\` ``: FormBox
- `\\@`: SqrtBox
- `\\/`: FractionBox
- `\\[%&+_^]`: x-scriptBox (x can be Sub/Super/Over/Under/...)
- `\\\*`: box constructors

Reference: [String Representation of Boxes](https://reference.wolfram.com/language/tutorial/StringRepresentationOfBoxes.html).

### Comment blocks

A comment block is wrapped in a pair of `(*` and `*)`:

```yaml
begin: \(\*
end: \*\)
patterns: !push comment-block
```

Note: in the inner scope of a comment block, the rule itself must be included because the following syntax is legal in Wolfram Language and can be found in some *.wl* files:

```mathematica
(* ::Input:: *)
(*(* some *)
(* comments *)*)
```

### Shorthand expressions

There are also some syntaxes which corresponds to a function but cannot be simply treated as operators.

- [Out](https://reference.wolfram.com/language/ref/Out.html): `%(\d*|%*)`
- [Slot](https://reference.wolfram.com/language/ref/Slot.html): `(#[a-zA-Z]{{alnum}}*|#\d*)`
- [MessageName](https://reference.wolfram.com/language/ref/MessageName.html): `(::)\s*({{alnum}}+)`
- [Get](https://reference.wolfram.com/language/ref/Get.html), [Put](https://reference.wolfram.com/language/ref/Put.html), [PutAppend](https://reference.wolfram.com/language/ref/PutAppend.html): ``(<<|>>>?) *([a-zA-Z0-9`/.!_:$*~?\\-]+) *(?=[\)\]\},;]|$)``

Reference: [Wolfram Language Syntax](https://reference.wolfram.com/language/guide/Syntax.html).

### Escaping before newlines

Finally, if a back-slash (`\\\r?\n`) is placed before a newline, it will eacape the newline.
