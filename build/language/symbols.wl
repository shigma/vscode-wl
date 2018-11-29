(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


Begin["wl`"];


usageDictionary = Import[FileNameJoin[{$InstallationDirectory,"SystemFiles/Kernel/TextResources/English/usage.m"}], "Text"]


namespace = Select[Names["System`*"], PrintableASCIIQ];

Function[usages,
	usageDictionary = Select[usages, Head["Definition" /. Values[#]] === String &];
	usagePresentSymbols = Keys @ usageDictionary;
	usageAbsentSymbols = Complement[namespace, usagePresentSymbols];
] @ util`ruleMap[Block[{symbol = Symbol[#]},
	Join[SyntaxInformation[symbol], {
		"Definition" -> ToExpression[# <> "::usage"],
		"Attributes" -> Attributes[Evaluate[symbol]]
	}]
] &, namespace];


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


DumpSave[NotebookDirectory[] <> "../dist/wldata.mx", "wl`"];


End[];
