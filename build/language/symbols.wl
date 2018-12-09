(* ::Package:: *)

<< (NotebookDirectory[] <> "utilities.wl");


documentedLists = Keys[#] -> Values[#] /@ util`getGuideText["ListingOf" <> util`toCamel[Keys[#]]] & /@ {
	"named_characters" -> (StringTake[#, {3, -2}]&) @* util`getAtomic[{1, 1, -1, 1}],
	"supported_external_services" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}],
	"all_formats" -> (StringTake[#, {2, -2}]&) @* util`getAtomic[{1, 1, 1, 1, 1, 1, 1, 1, 1}]
};


(* ::Subsubsection:: *)
(*Utilities*)


resolveFileName[filename_] := FileNameJoin[{NotebookDirectory[], "../..", filename}];
readFile[filename_] := Import[resolveFileName[filename], "String"];
writeFile[filename_, content_] := Export[resolveFileName[filename], content, "Text"];
writeJSON[filename_, expression_] := writeFile[filename, Developer`ToJSON[expression, Compact -> True]];
getMFileNames[directory_] := FileBaseName /@ FileNames["*.m", directory];


(* ::Subsubsection:: *)
(*Namespace*)


getSymbolList::usage = "getSymbolList[context] returns all the symbols which belong to the context.";
getSymbolList[context_String] := Select[Names[context <> "*"], PrintableASCIIQ];

getContextSymbolList::usage = "getContextSymbolList[context] returns all the symbols which belong to the context with the context name.";
getContextSymbolList[context_String] := If[StringStartsQ[#, context], #, context <> #]& /@ getSymbolList[context];

SetAttributes[{getSymbolList, getContextSymbolList}, Listable];


(* ::Text:: *)
(*Addons contexts can be found at FileNames["*/*", FileNameJoin[{$InstallationDirectory, "AddOns"}]].*)
(*1. If an addons was found in ExtraPackages, it cannot be directly needed and should always be needed with subcontexts.*)
(*2. If no pacletinfo.m file was found, we will look into the directory and treat filenames as subcontexts.*)
(*3. If a "Kernel" extension was declared in the pacletinfo, we will take the context in the declaration.*)
(*4. In other cases, we assume that the package name is the only context.*)


addonsSymbolList = Block[{pacletinfo, extensions, context = FileBaseName[#] <> "`"},
	pacletinfo = Quiet @ Import[# <> "/PacletInfo.m"];
	If[FileNameTake[#, {-2}] === "ExtraPackages",
		(Needs[#]; getContextSymbolList[#])&[context <> # <> "`"]& /@ getMFileNames[#],
		Needs[context];
		If[pacletinfo === $Failed,
			If[# <> "`" === context, Unevaluated[Nothing], context <> # <> "`"]& /@ getMFileNames[#] // Append[context],
			extensions = Cases[Extensions /. Level[pacletinfo, 1], {"Kernel", rules___} :> {rules}] // Flatten;
			If[Length[extensions] === 0, {context}, Context /. extensions]
		] // getContextSymbolList
	]
]& /@ FileNames["*/*", FileNameJoin[{$InstallationDirectory, "AddOns"}]] // Quiet // Flatten;


(* ::Text:: *)
(*Some addons may inject symbols into system context, and some others may share same symbol names with some system symbols. So system symbols should be collected after all addons was needed and context prefixes should be removed.*)


systemSymbolList = If[StringStartsQ[#, "System`"], StringDrop[#, 7], #]& /@ getSymbolList["System`"];


makeTree[list_] := KeyValueMap[
	If[StringEndsQ[#1, "`"],
		Prepend[makeTree @ With[{l = StringLength[#1]}, StringDrop[#, l]& /@ #2], #1],
	#1]&,
	GroupBy[list, First @* StringCases[(WordCharacter | "$").. ~~ ("`" | EndOfString)]]
];


writeJSON["out/resources/system.json", systemSymbolList];
writeJSON["out/resources/addons.json", addonsSymbolList];


systemSymbolList = Import[resolveFileName["out/resources/system.json"]];
addonsSymbolList = Import[resolveFileName["out/resources/addons.json"]];


(* ::Subsubsection:: *)
(*Usages*)


(* ::Text:: *)
(*Get usage text.*)


usageDictionary = Association @* StringCases[RuleDelayed[
	symbol: RegularExpression["^[\\w`$]+"] ~~ "::usage = " ~~ usage: RegularExpression["\"(\\\\\"|[^\"])*\""],
	symbol -> ToExpression[usage]
]] @ Import[FileNameJoin[{$InstallationDirectory, "SystemFiles/Kernel/TextResources/English/usage.m"}], "Text"];


With[{usage = ToExpression[# <> "::usage"]},
	If[Head[usage] === String, AssociateTo[usageDictionary, # -> usage]]
]& /@ Complement[Union[systemSymbolList, addonsSymbolList], usageDictionary // Keys];
Export[resolveFileName["dist/usageText.json"], usageDictionary];


usageDictionary = Association @ Import[resolveFileName["dist/usageText.json"]];


(* ::Text:: *)
(*Get usage AST.*)


boxFormInString = "\!\(\*" ~~ Except["\)"]... ~~ "\)";
Protect[StringSequence];

toSerializable[expr_] := expr //. str_String ? (StringContainsQ[boxFormInString]) :> 
	StringSequence @@ StringSplit[str, box: boxFormInString :> ToExpression[StringDrop[box, 1]]];
toSafeSerializable[expr_] := expr //. str_String ? (StringContainsQ[boxFormInString]) :> 
	StringSequence @@ StringSplit[str, box: boxFormInString :>
		Quiet @ Check[ToExpression @ StringDrop[box, 1], FE`makePlainText[box]]];

toUsageAST[usage_String] := usage // toSafeSerializable \
	// Developer`WriteExpressionJSONString // Developer`FromJSON;


(* ::Text:: *)
(*There may be some symbols with malformed usages in the system. You can check out such symbols by the following code:*)


(* ::Input:: *)
(*KeyValueMap[Quiet@Check[toSerializable[#2],Sow[#1]]&,usageDictionary]//Reap//Last//First*)


(* ::Text:: *)
(*Output: AskTemplateDisplay, ConnectSystemModelComponents, DeleteCloudExpression, TetGenLink`TetGenExport, TetGenLink`TetGenImport.*)


Export[resolveFileName["dist/usageAST.json"], toUsageAST /@ usageDictionary];


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
Export[resolveFileName["dist/namespace.json"], classifiedNamespace];


classifiedNamespace = Import[resolveFileName["dist/namespace.json"]];


(* ::Subsubsection:: *)
(*GuideText*)


getGuideText[filename_] := Import[FileNameJoin[{$InstallationDirectory, "Documentation/English/System/Guides", filename <> ".nb"}], {"Cells", "GuideText"}];


{namedCharacters, {namedCharactersDict}} = Reap[Block[{code, name},
	name = StringTake[#[[-1, 1]], {3, -2}];
	code = Quiet @ ToCharacterCode[#[[1, 1, 1]], "Unicode"][[1]];
	If[NumberQ[code], Sow[StringPadLeft[IntegerString[code, 16], 4, "0"] -> name]]; name
]& /@ getGuideText["ListingOfNamedCharacters"][[All, 1, 1]]];
Export[resolveFileName["dist/namedCharacters.json"], namedCharactersDict];
