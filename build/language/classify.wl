(* ::Package:: *)

<< (NotebookDirectory[] <> "../../dist/wldata.mx");
<< (NotebookDirectory[] <> "utilities.wl");


$dataset = Association[wl`documentedLists];
AssociateTo[$dataset, "built_in_undocumented_symbols" -> wl`usageAbsentSymbols];


classify[usages_, func_Function] := Last @ Reap[
	Sow[Keys[#], func[Values[#]]] & /@ usages,
	_String,
	Rule
] // (AssociateTo[$dataset, #]; #) &;

classify[usages_, rules_Association] := classify[usages,
	Function[usage, Piecewise @ KeyValueMap[{#1, #2[usage]} &, rules]]
];


classifiedNamespace = classify[Keys[#] -> ("Definition" /. Values[#]) & /@ wl`usageDictionary, <|
	"built_in_functions" -> StringStartsQ["\!\(\*RowBox[{"],
	"built_in_options" -> StringContainsQ[RegularExpression["is an? (\\w+ )?option"]],
	"built_in_constants" -> (True &)
|>];


getLines[name_] := Select[StringStartsQ[
	"\!\(\*RowBox[{" ~~ ("\"" | "") ~~ name
]] @ StringCases[RegularExpression["(\!\(\*([^\)]+)\)|.)+"]][
	"Definition" /. (name /. wl`usageDictionary)
];

getArguments[usage_] := usage //
	StringCases[#, RegularExpression["\!\(\*([^\)]+)\)"] -> "$1", 1]& //
	First //
	ToExpression //
	util`getAtomic[{1}] //
	If[Length[#] <= 3, {}, util`getAtomic[{3, 1}][#]]& //
	If[ListQ[#], util`getAtomic[{1}] /@ Take[#, {1, -1, 2}], {#}]&;

functionArguments = util`ruleMap[
	getArguments /@ getLines[#]&,
	"built_in_functions" /. classifiedNamespace
];


testOne[crit_] := Length[#] > 0 && AllTrue[#, crit] &;
testAll[crit_, sel_: Identity] := testOne[Length[#] > 0 && crit[sel[#]] &];
isFunctional[arg_] := arg === "f" || arg === "crit" || arg === "test";

functionalFirstParam = Keys @ Select[functionArguments, testAll[isFunctional, First][Values[#]]&];
functionalLastParam = Keys @ Select[functionArguments, testAll[isFunctional, Last][Values[#]]&];


functionWithlocalVars = KeyDrop[GroupBy[wl`usageDictionary, "LocalVariables" /. Values[#]& -> Keys], {None, "LocalVariables"}];


collect[types__] := functionWithlocalVars[#]& /@ {types} // Flatten;
functionWithVarsLikeLimitAt2 = collect[{"Limit", {2}}];
functionWithVarsLikeLimitAt3 = collect[{"Limit", {3}}];
functionWithVarsLikeSolveAt2 = collect[{"Solve", {2}}];
functionWithVarsLikeSolveFrom2 = collect[{"Solve", {2, \[Infinity]}}];
functionWithVarsLikePlotFrom2 = collect[{"Plot", {2}}, {"Plot",{2, 3}}, {"Plot", {2, 4}}, {"Plot", {2, \[Infinity]}}, {"D", {2, \[Infinity]}}, {"Table", {2, \[Infinity]}}, {"Integrate", {2, \[Infinity]}}];
functionWithVarsLikeManipulateFrom2 = collect[{"Manipulate", {2}}, {"Manipulate", {2, \[Infinity]},"Lexical"}];
functionWithVarsLikePlotFrom3 = collect[{"Plot", {3, \[Infinity]}}];


$dataset["functional_last_param"] = functionalLastParam;
$dataset["functional_first_param"] = Complement[functionalFirstParam, Flatten @ Values[functionWithlocalVars]];
$dataset["limit_functions"] = functionWithVarsLikeLimitAt2;
$dataset["asymptotic_functions"] = functionWithVarsLikeLimitAt3;
$dataset["local_solve_var_at_2"] = Complement[functionWithVarsLikeSolveAt2, functionalFirstParam];
$dataset["local_grad_var_at_2"] = Intersection[functionWithVarsLikeSolveAt2, functionalFirstParam];
$dataset["local_solve_var_from_3"] = functionWithVarsLikeSolveFrom2;
$dataset["local_plot_var_from_2"] = Complement[functionWithVarsLikePlotFrom2, functionalFirstParam];
$dataset["local_sum_var_from_2"] = Intersection[functionWithVarsLikePlotFrom2, functionalFirstParam];
$dataset["local_manipulate_var_from_2"] = functionWithVarsLikeManipulateFrom2;
$dataset["local_plot_var_from_3"] = functionWithVarsLikePlotFrom3;


Export[util`resolveFileName["../../dist/macros.json"], $dataset];


Export[util`resolveFileName["../../dist/namespace.json"], wl`namespace];


Export[util`resolveFileName["../../dist/usages.json"], Keys[#] -> ("Definition" /. Values[#]) & /@ wl`usageDictionary];
