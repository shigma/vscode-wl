(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


(* ::Subsubsection:: *)
(*Namespace*)


getSymbolList::usage = "getSymbolList[context] returns all the symbols which belong to the context.";
getSymbolList[context_String] := Select[Names[context <> "*"], PrintableASCIIQ];

getContextSymbolList::usage = "getContextSymbolList[context] returns all the symbols which belong to the context with the context name.";
getContextSymbolList[context_String] := If[StringStartsQ[#, context], #, context <> #]& /@ getSymbolList[context];

SetAttributes[{getSymbolList, getContextSymbolList}, Listable];

getDotMFileNames[directory_] := FileBaseName /@ FileNames["*.m", directory];


addonsSymbolList = Block[{pacletinfo, extensions, context = FileBaseName[#] <> "`"},
	pacletinfo = Quiet @ Import[# <> "/PacletInfo.m"];
	If[FileNameTake[#, {-2}] === "ExtraPackages",
		(* Extra packages cannot be directly needed *)
		(Needs[#]; getContextSymbolList[#])&[context <> # <> "`"]& /@ getDotMFileNames[#],
		Needs[context];
		If[pacletinfo === $Failed,
			(* No pacletinfo file was found *)
			If[# <> "`" === context, Unevaluated[Nothing], context <> # <> "`"]& /@ getDotMFileNames[#] // Append[context],
			extensions = Cases[Extensions /. Level[pacletinfo, 1], {"Kernel", rules___} :> {rules}] // Flatten;
			If[Length[extensions] === 0, {context}, Context /. extensions]
		] // getContextSymbolList
	]
]& /@ FileNames["*/*", FileNameJoin[{$InstallationDirectory, "AddOns"}]] // Quiet // Flatten;

systemSymbolList = If[StringStartsQ[#, "System`"], StringDrop[#, 7], #]& /@ getSymbolList["System`"];


util`writeFile["out/resources/system.json", util`toJSON[systemSymbolList]];
util`writeFile["out/resources/addons.json", util`toJSON[addonsSymbolList]];


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
