
(* Numbers and constants *)

(* Base form, precision, accuracy and scientific notations *)

11^^1a.a1`11*^-11

(* Arithmetic operators *)

1 + 1 - 1 * 1 / 1 ^ 1

(* Logical and comparison operators *)

1 > 2 || 3 <= 4 && 5 =!= 6

(* Built-in constants and symbols *)

True
Center
$Failed


(* Strings and boxes *)

(* Raw String with named, escaped, encoded and invalid characters *)

"This is a \`string` (* not \a comment *)"
"\[Alpha] \:abcd \.ef \123 \[foo] \678 \:012 \.3x"

(* String templates in messages and spectified functions *)

foo::bar::lang = "Here is an `argument`."
StringTemplate["Value `a`: <* Range[#n] *>."][<|"a" -> 1234, "n" -> 3|>]

(* String operators and expressions *)

"foo" <> "bar" ~~ "baz"

(* Strings inside RegularExpression will be specially displayed *)

RegularExpression["^a\n.+?\\^[^a-f*]{2,}"]
RegularExpression["(?=[^[:alpha:]](\\d*))\\g1\\2"]

(* Box representation are also supported *)

"box 1: \!\(x\^2\); box 2: \(y\^3\) "

\(x + \*GridBox[{
  {"a", "b"},
  {"c", \(d \^ 2\)}
}]\)


(* Variables and patterns *)

(* A variable may contain backquotes and dollars *)

my`context12`$foo$bar

(* Using Put and Get *)

<< EquationTrekker`
>>> OutputFile.mx

(* Patterns with Default, Blank, Optional and PatternTest *)

_.; _h; __h; ___h
var: patt ? EvenQ : foo

(* Built-in options are also displayed like parameters *)

Image[Red, Interleaving -> True]


(* Assignments and rules *)

(* Declaration for functions *)

f[x_ ? TrueQ, y_ /; Negative[y], z, OptionsPattern[]] := 2x /; y > 0;

(* Rules *)

foo /. { foo :> 1, bar :> 2 }
foo //. { foo -> 1, bar -> 2 }
Graph[{ 1 <-> 2, 2 -> 3, 3 -> 1 }]


(* Brackets *)

<|   |>
 [   ]
 {   }
 (   )
[[   ]]

(* Parts should not be confused with function calls *)

list[[]]
func[ []]


(* Functions *)

(* Functional operators can change the color of neighbouring variables *)

foo @ bar; foo @@ bar; foo @@@ bar; foo // bar
bar /@ {}; foo //@ {}; foo /* bar; foo @* bar
foo ~ bar ~ foo ~ Plus ~ foo

(* But built-in functions are always displayed as usual *)

cos[[Pi]]; cos[Pi]
Cos[Pi]; System`Cos[Pi]


(* Other notations *)

(* Out *)

%%%; %12

(* Definition *)

?foo; ??bar

(* comment (* another comment *) *)
