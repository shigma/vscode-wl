(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


(* ::Subsubsection:: *)
(*Namespace*)


getSymbols[context_String] := Select[Names[context <> "*"], PrintableASCIIQ];


util`writeFile["out/resources/system.json", util`toJSON[systemSymbolList = getSymbols["System`"]]];
util`writeFile["out/resources/addons.json", util`toJSON[
	addonsSymbolList = With[{context = # <> "`"},
		Quiet[Needs[context]];
		If[StringStartsQ[#, context], #, context <> #]& /@ getSymbols[context]
	]& /@ FileBaseName /@ FileNames["*", FileNameJoin[{$InstallationDirectory, "AddOns"}], {2}] // Flatten
]];


systemSymbolList = Import[util`resolveFileName["out/resources/system.json"]];
addonsSymbolList = Import[util`resolveFileName["out/resources/addons.json"]];


(* ::Subsubsection:: *)
(*Usages*)


usageDictionary = Association @* StringCases[RuleDelayed[
	symbol: RegularExpression["^[\\w`$]+"] ~~ "::usage = " ~~ usage: RegularExpression["\"(\\\\\"|[^\"])*\""],
	symbol -> ToExpression[usage]
]] @ Import[FileNameJoin[{$InstallationDirectory, "SystemFiles/Kernel/TextResources/English/usage.m"}], "Text"];


With[{usage = ToExpression[# <> "::usage"]},
	If[Head[usage] === String, AssociateTo[usageDictionary, # -> usage]]
]& /@ Complement[Union[systemSymbolList, addonsSymbolList], usageDictionary // Keys];
Export[util`resolveFileName["dist/usages.json"], usageDictionary];


usageDictionary = Import[util`resolveFileName["dist/usages.json"]];


(* ::Subsubsection:: *)
(*Classify*)


classify[usages_, func_Function] := Last @ Reap[Sow[Keys[#], func[Values[#]]] & /@ usages, _String, Rule];
classify[usages_, rules_Association] := classify[usages,
	Function[usage, Piecewise @ KeyValueMap[{#1, #2[usage]} &, rules]]
];


classifiedNamespace = Append[classify[Normal @ usageDictionary, <|
	"built_in_functions" -> StringStartsQ["\!\(\*RowBox[{"],
	"built_in_options" -> StringContainsQ[RegularExpression["is an? (\\w+ )?option"]],
	"built_in_constants" -> (True &)
|>], "undocumented_symbols" -> Complement[Union[systemSymbolList, addonsSymbolList], usageDictionary // Keys]];
Export[util`resolveFileName["dist/namespace.json"], classifiedNamespace];


classifiedNamespace = Import[util`resolveFileName["dist/namespace.json"]];
