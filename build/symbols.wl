(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


Begin["wl`"];


namespace = Select[Names["System`*"], PrintableASCIIQ];

Function[usages,
	usageDictionary = Select[usages, Head["Definition" /. Values[#]] === String &];
	usagePresentSymbols = Keys @ usageDictionary;
	usageAbsentSymbols = Complement[namespace, usagePresentSymbols];
] @ util`ruleMap[Block[{symbol = Symbol[#]},
	Join[SyntaxInformation[symbol], {
		"Definition" -> MessageName[Evaluate[symbol], "usage"],
		"Attributes" -> Attributes[Evaluate[symbol]]
	}]
] &, namespace];


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


DumpSave[NotebookDirectory[] <> "wldata.mx", "wl`"];


Export[util`resolveFileName["usages.json"], wl`usageDictionary];


util`writeFile["../completions.sublime-completions", util`toJSON[{
	"scope" -> "source.wolfram",
	"completions" -> Sort[StringReplace[StartOfString ~~ "$" -> ""] /@ wl`namespace]
}]];


End[];
