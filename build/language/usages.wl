BeginPackage["util`"];

UsageParser::usage = "UsageParser[symbol] ";

Begin["`Private`"];

$here = ParentDirectory[$InputFileName /. "" -> NotebookFileName[]];

getBox[str_String] := StringReplace[str, Shortest["\!\(\*" ~~ expr__ ~~ "\)"] :> Hold[expr]]
format = {
	<|"type" -> "code", "content" -> getFunction[# // First]|>,
	<|"type" -> "text", "content" -> getUsage[# // Rest]|>
}&;

$PlainRule = {
	"Subscript[" ~~ a__ ~~ ", " ~~ b__ ~~ "]" /; StringFreeQ[a <> b, "]"] :> a <> b,
	"\\[" ~~ a__ ~~ "]" /; StringFreeQ[a, "]"] :> ToString[ToExpression["\\[" <> a <> "]"]]
};
$PlainFixRule = {
	"," -> ", "
};
getFunction[getBox_] := Block[
	{raw = getBox /. Hold[str_] :> FE`makePlainText["\!\(\*" <> str <> "\)"]},
	StringReplace[Fold[StringReplace, raw, $PlainRule], $PlainFixRule]
];

(*TR=Times Regular*)
(*TI=Times Italic*)
$MDRule = {
	StyleBox[f_, "TI"] :> {"*", f, "*"},
	StyleBox[f_, ___] :> {f},
	RowBox[l_] :> {l},
	SubscriptBox[a_, b_] :> {a, "_", b},
	SuperscriptBox[a_, b_] :> {a, "^", b},
	FractionBox[a_, b_] :> {"(", a, ")/(", b, ")"},
	OverscriptBox[a_, b_] :> {a}
};
BoxParser[str_String] := StringRiffle[Flatten@ReleaseHold[MakeExpression[str, StandardForm] //. $MDRule], ""];
getUsage[expr_] := StringDrop[expr /. Hold :> BoxParser, 1];(*Drop first space*)


splitUsage[sym_] := StringSplit[StringReplace[MessageName[sym, "usage"], "\n\!" -> "\r\!"], "\r"];
UsageParser[sym_Symbol] := Flatten[format@*getBox /@ splitUsage[sym]];

End[];

EndPackage[]