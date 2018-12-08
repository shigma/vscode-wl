$CommonPackages::usage = "常见的包名";
$CommonPackages = {"System", "Internal", "Developer", "NeuralNetworks", "TypeSystem", "PacletManager"} // Sort
$DistributionPackages::usage = "Mathematica 发行版中包括的包名, 不包含常见包名";
$DistributionPackages = FileBaseName /@ FileNames["*", FileNameJoin[{$InstallationDirectory, "AddOns"}], {2}] // Sort
$ServerPackages::usage = "所有远程服务器上注册了的包名";
$ServerPackages = Select[
	DeleteDuplicatesBy[Flatten@{PacletFindRemote["*"], PacletFind["*"]}, First],
	!StringContainsQ[#[[1, -1]], {"Data_", "Lookup_"}]&
][[All, 1, -1]] // Sort


(*
(*find all undoc symbols, 1552 counted*)
symbols = Sort@Flatten[Select[Names[# <> "`*"], PrintableASCIIQ]& /@ $CommonPackages];
Quiet@Cases[ParallelMap[ToExpression[# <> "::usage"]&, symbols] // ProgressReport, _MessageName]
(*About 85s, 12ms each symbol*)
*)

reGroup[ctx_] := Block[
	{sym = Rest /@ ctx, fs, rs},
	fs = Flatten@Select[sym, Length[#] == 1&];
	rs = Select[sym, Length[#] != 1&];
	If[Length@rs != 0, PrependTo[fs, reGroup /@ GroupBy[rs, First]]];
	Return@fs
];
SymbolTree[] := Block[
	{filter, gather, split},
	Echo[Length[names = Select[Names["*`*"], PrintableASCIIQ]], "Symbols: "];
	filter = Select[names, !StringContainsQ[#, {"Dump`", "Private`", RegularExpression["`[a-z]"], RegularExpression["\$[0-9]"], "$$"}]&];
	gather = GatherBy[{Context@#, Last@StringSplit[#, "`"]}& /@ filter, First];
	split = Sort[Append[StringSplit[Context@#, "`"], Last@StringSplit[#, "`"]]& /@ filter];
	(*split=Sort[{Context@#,Last@StringSplit[#,"`"]}&/@filter]*)
	reGroup /@ GroupBy[split, First]
];

(* Drop global` and utils` *)
Table[Quiet[Needs[# <> "`"]& /@ $DistributionPackages], {i, 3}];
Export["Symbols.json", KeyDrop[SymbolTree[], "Global"], "RawJSON"]
