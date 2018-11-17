(* ::Package:: *)

Begin["util`"];

getAtomic[orders_List] := If[Length[orders] == 0 || Length[#] == 0,
	#2,
	getAtomic[Rest[orders]][#[[First[orders]]]]
]&[Level[#, 1], #]&;

ruleMap[func_, list_] := With[{size = Length @ list},
	Monitor[
		Quiet @ Table[list[[i]] -> func[list[[i]]], {i, size}],
		ProgressIndicator[i / size]
	]
];

resolveFileName[filename_] := FileNameJoin[{NotebookDirectory[], filename}]
readFile[filename_] := Import[resolveFileName[filename], "String"];
writeFile[filename_, content_] := Export[resolveFileName[filename], content, "String"];
replaceFile[filename_, rules_] := writeFile[filename, StringReplace[readFile[filename], rules]];

getGuideText[filename_] := Import[FileNameJoin[{
	$InstallationDirectory,
	"Documentation",
	$Language,
	"System/Guides",
	filename <> ".nb"
}], {"Cells", "GuideText"}];

toCamel[source_] := StringReplace[source,
	("-" | "_" | " " | StartOfString) ~~ char_ :> ToUpperCase[char]
];

toJSON[expression_, indent_: 2] := StringReplace[
	JSONTools`ToJSON[expression],
	StartOfLine ~~ whitespace: " ".. :> StringTake[whitespace, StringLength @ whitespace / 4 * indent]
];

End[];
