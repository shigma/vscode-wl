BeginPackage["util`"];

UsageParser::usage = "UsageParser[expr] ";

Begin["`Private`"];

$here = ParentDirectory[$InputFileName /. "" -> NotebookFileName[]];

getBox[str_String] := StringReplace[str, Shortest["\!\(\*" ~~ expr__ ~~ "\)"] :> Hold[expr]]
format = {
	<|"type" -> "code", "content" -> getFunction[# // First]|>,
	<|"type" -> "text", "content" -> getUsage[# // Rest]|>
}&;

$PlainRule = {
	RowBox[s_] :> s,
	StyleBox[s_, any_] :> s,
	SubscriptBox[a_, b_] :> {a, b}
};
getFunction[getBox_] := StringRiffle[Flatten[ReleaseHold[getBox /. Hold :> MakeExpression] //. $PlainRule], ""];

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


UsageParser[expr_Symbol] := Flatten[format@*getBox /@ StringSplit[MessageName[expr, "usage"], "\n"]];

End[];

EndPackage[]