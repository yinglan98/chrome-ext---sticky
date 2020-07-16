
let TEST_MODE = false;
print_details("TEST_MODE = " + TEST_MODE + "\n");
print_details("background page started running");
let memory = {};
memory["total_num"] = "0";
memory["next_id"] = "0";
memory["id_list"] = [];
//all_quills contain [id] : [content] mappings
memory["all_quills"] = {};
let background_ready = false

/*
	Get all the info stored in the chrome browser, if any
	Note: when ext gets refreshed and / or brower quits and opens - background page runs
*/
chrome.storage.local.get(["total_num", "next_id", "id_list", "all_quills"], function(res_dict){
	print_details("memory from chrome" + JSON.stringify(res_dict));
	let curr_total_num = parseInt(res_dict["total_num"]);
	if(res_dict["total_num"] && curr_total_num > 0){
		print_details("already has memory \n");
		if(TEST_MODE){
			console.assert(curr_total_num === Object.keys(res_dict["all_quills"]).length);
			console.assert(curr_total_num === res_dict["id_list"].length);
		}
		memory["total_num"] = res_dict.total_num;
		memory["next_id"] = res_dict.next_id;
		memory["id_list"] = [...res_dict.id_list];
		let temp = JSON.stringify(res_dict.all_quills)
		print_details("quill content from memory = \n" + temp);
		memory["all_quills"] = JSON.parse(temp);
	}
	background_ready = true;
});

function get_ready(){
	return background_ready;
}

/*
	Return a STRINGIFIED Json object that contains the variables requested and their respective values
	Param var_list: {Array[]} a list of variables the calling functions want the values of
*/
function get_variables(var_list){
	print_details("get_variables called");
	ret = {}
	var_list.forEach(
		function(var_name){
			if(var_name === "total_num"){
				ret[var_name] = memory["total_num"];
			}
			else if(var_name === "next_id"){
				ret[var_name] = memory["next_id"];
			}
			else if(var_name === "id_list"){
				ret[var_name] = [...memory["id_list"]];
			}
			else if(var_name === "all_quills"){
				ret[var_name] = memory["all_quills"];
			}
		});
	let JSON_ret = JSON.stringify(ret);
	print_details("get_variables returned: \n " + JSON_ret);
	return JSON_ret;
}

/*
	Set memory to contain same data as var_list
	Param var_list: {String} a JSON_STRINGIFIED string of all the data that memory should have
	NOTE: this function is only called during store_notes()
*/
function set_variables(var_list){
	print_details("set_variables called");
	print_details("set_variables param var_list: \n" + var_list);
	memory = JSON.parse(var_list);
	if(TEST_MODE){
		console.assert(parseInt(memory["total_num"]) === Object.keys(memory["all_quills"]).length);
		console.assert(parseInt(memory["total_num"]) === memory["id_list"].length);
	}

	chrome.storage.local.set(memory,function(){
		print_runtime_error();
		print_details("finished saving to chrome memory");
	})
}

/*
	Called when delete_note is called
	Deletes the quill content of the corresponding id - other data
	fields will automatically be changed when save_notes happen
	Note: Entering the else clause is not an error -> happens when user creates then deletes
	without saving
*/
function delete_quill_mem(id){
	print_details("delete_quill_mem called");
	if(Object.keys(memory["all_quills"]).includes(id)){
		print_details("delete_quill_mem: has the key we want to delete");
		delete memory["all_quills"][id];
	}
	else{
		print_details("delete_quill_mem: does not have key to be deleted");
	}
}

// chrome.runtime.onInstalled.addListener(function(){
// 	chrome.storage.local.get("next_id", function(res){
// 		if(!res.next_id){
// 			chrome.storage.local.set({"next_id":"0", "total_num":"0", "id_list":[]}, function(){
// 				console.log("background set finished");
// 			});
// 		}
// 	});
// })

/*
	helper function that prints chrome memory get / store error
*/
function print_runtime_error(){
	if(chrome.runtime.lastError){
		console.log(chrome.runtime.lastError.message);
	}
}

/*
	if test mode is turned on - output these details
*/
function print_details(msg){
	if(TEST_MODE){
		console.log(msg);
	}
}
