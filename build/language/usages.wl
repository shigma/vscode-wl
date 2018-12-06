(* ::Package:: *)

BeginPackage["util`"];

UsageParser::usage = "UsageParser[symbol] ";

Begin["`Private`"];

(*FrontEnd function is used and cannot be entered in command line*)
(*$here = ParentDirectory[$InputFileName /. "" -> NotebookFileName[]];*)
$here = NotebookDirectory[];

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
	SubscriptBox[a_, b_] :> {a, b},
	SuperscriptBox[a_, b_] :> {a, b},
	FractionBox[a_, b_] :> {"(", a, ")/(", b, ")"},
	OverscriptBox[a_, b_] :> {a}
};
BoxParser[str_String] := StringRiffle[Flatten@ReleaseHold[MakeExpression[str, StandardForm] //. $MDRule], ""];
getUsage[expr_] := StringDrop[expr /. Hold :> BoxParser, 1];(*Drop first space*)
nonFunctionCase[usage_MessageName] := "**" <> ToString@First[usage] <> "** is a build-in symbol but not be documented.";
nonFunctionCase[usage_] := Block[
	{plain = FE`makePlainText@usage},
	StringReplace[getFunction@plain, "\r\n" -> ""]
];
splitUsage[sym_Symbol] := StringSplit[StringReplace[MessageName[sym, "usage"], "\n\!" -> "\r\!"], "\r"];
UsageParser[sym_String] := Block[
	{spited},
	If[
		SyntaxInformation[ToExpression@sym] === {},
		Return[<|"type" -> "text", "content" -> nonFunctionCase@ToExpression[sym <> "::usage"]|>]
	];
	spited = splitUsage[ToExpression@sym];
	Flatten[format@*getBox /@ spited]
];


End[];

EndPackage[]


Developer`WriteExpressionJSONString[StringSplit[usageDictionary["Import"],"\!\(\*"~~content: Except["\)"]...~~"\)":>ToExpression[content]],Compact->True]


RowBox[{"Import","[",StyleBox["\"\!\(\*StyleBox[\"file\",\"TI\"]\)\"",ShowStringCharacters->True],"]"}]//Developer`WriteExpressionJSONString
