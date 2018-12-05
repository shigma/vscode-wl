(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


usageDictionary = Import[FileNameJoin[{$InstallationDirectory,"SystemFiles/Kernel/TextResources/English/usage.m"}], "Text"]


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


(* ::Subsubsection:: *)
(*Get namespace*)


getSymbols[context_String] := Select[Names[context <> "*"], PrintableASCIIQ];
util`writeFile["out/resources/system.json", util`toJSON[getSymbols["System`"]]];
util`writeFile["out/resources/addons.json", util`toJSON[
	With[{context = # <> "`"},
		Quiet[Needs[context]];
		If[StringStartsQ[#, context], #, context <> #]& /@ getSymbols[context]
	]& /@ FileBaseName /@ FileNames["*", FileNameJoin[{$InstallationDirectory, "AddOns"}], {2}] // Flatten
]];
