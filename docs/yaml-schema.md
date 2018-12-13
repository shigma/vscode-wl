# Extended YAML Schema for Syntax Definitions

The syntax definition for Wolfram Language is very complicated. It is hard to write such a big JSON file with expansibility and maintainability, so I use YAML to define all the syntaxes and use some special [tags](https://yaml.org/spec/1.2/spec.html#id2761292) to simplify the writing process. This page will tell you how the extended schema works.

All the source files can be found under directory [*build/types*](../build/types).

## Glossary

Every tag has its own environment and parameter type. In this schema, there are 4 environments and 3 parameter types.

### Tag Environments

1. regex: used under `match`, `begin` and `end`.
2. capture: used under `captures`, `beginCaptures` and `endCaptures`.
3. rule: used as a wrapper of a rule under a list of patterns.
4. context: used under `patterns` or as the root of a context.

### Tag Parameter Types

1. scalar: parameters are written in a line separated by whitespaces after the tag name.
2. sequence: parameters are witten in a list under the tag name.
3. mapping: parameters are witten in an object under the tag name.

## Basic Types

There are some basic types in the schema. These types are all very simple and easy to use. [*src/syntaxes/simplest.yaml*](../src/syntaxes/simplest.yaml) only uses tags from this category so it may serves as a perfect example of how to use these tags.

### raw

*(capture/mapping)* It traverses all the captures and turn every string value into objects. For example:

```yaml
endCaptures: !raw
  1: '#function-identifier'
  2: keyword.operator.call.wolfram
```
will be transpiled into
```json
{
  "endCaptures": {
    "1": { "patterns": [{ "include": "#function-identifier" }] },
    "2": { "name": "keyword.operator.call.wolfram" }
  }
}
```

### all

*(capture/scalar)* It turns the parameter into the only capture of the regex. For Example:

```yaml
beginCaptures: !all keyword.operator.call.wolfram
```
will be transpiled into
```json
{
  "beginCaptures": {
    "0": { "name": "keyword.operator.call.wolfram" }
  }
}
```

### push

*(context/scalar)* It turns the parameter into the only rule of the context. The parameter will serves as the include target. For Example:

```yaml
patterns: !push expressions
```
will be transpiled into
```json
{
  "patterns": [{ "include": "#expressions" }]
}
```

### no-whitespace

*(regex/scalar)* It joins the contents together and removes the whitespace and comments in each line. For Example:

```yaml
begin: !no-whitespace |-
  ({{identifier}})?
  (?:
    (_\.)               # Default
    |
    (_{1,3})            # Blank, BlankSequence, BlankNullSequence
    ({{identifier}})?   # Head
  )
```
will be transpiled into
```json
{
  "begin": "({{identifier}})?(?:(_\\.)|(_{1,3})({{identifier}})?)"
}
```

### bracket

*(rule/scalar)* It generates a rule for bracketing by the name of bracket given by the parameter. For Example:

```yaml
- !bracket association
```
will be transpiled into
```json
[{
  "begin": "<\\|",
  "beginCaptures": {
    "0": { "name": "punctuation.section.association.begin.wolfram" }
  },
  "end": "\\|>",
  "endCaptures": {
    "0": { "name": "punctuation.section.association.end.wolfram" }
  },
  "name": "meta.association.wolfram",
  "patterns": [{ "include": "#expressions" }]
}]
```

## General Types

### builtin

### function

### string-function

### cell-style

### slot

### clone

## Type-Inference Types

See [type inference]().
