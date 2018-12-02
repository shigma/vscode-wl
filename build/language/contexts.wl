$CommonPackages::usage = "常见的包名";
$CommonPackages = {"System", "Internal", "Developer", "NeuralNetworks", "TypeSystem", "PacletManager"} // Sort
$DistributionPackages::usage = "Mathematica 发行版中包括的包名, 不包含常见包名";
$DistributionPackages = FileBaseName /@ FileNames["*", FileNameJoin[{$InstallationDirectory, "AddOns"}], {2}] // Sort
$ServerPackages::usage = "所有远程服务器上注册了的包名";
$ServerPackages = Select[
	DeleteDuplicatesBy[Flatten@{PacletFindRemote["*"], PacletFind["*"]}, First],
	!StringContainsQ[#[[1, -1]], {"Data_", "Lookup_"}]&
][[All, 1, -1]] // Sort



(*find all undoc symbols, 1552 counted*)
symbols = Sort@Flatten[Select[Names[# <> "`*"], PrintableASCIIQ]& /@ $CommonPackages];
Quiet@Cases[ParallelMap[ToExpression[# <> "::usage"]&, symbols] // ProgressReport, _MessageName]
(*About 85s, 12ms each symbol*)