//testing message passing
// let temp = 1;
// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     // console.log(sender.tab ?
//     //             "from a content script:" + sender.tab.url :
//     //             "from the extension");
//     console.log(request.greeting);
//     if (request.greeting == "hello")
//     	++temp;
//     	console.log("new temp = " + temp);
//       sendResponse({farewell: "goodbye"});
//   });

//   console.log("temp = " + temp);

//   function increase_temp(){
// 	++temp;
// 	console.log("increased.temp = " + temp);
// 	return temp;
//   }

// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//   console.log("sent msg");
// });

// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
//     console.log("hi");
//   });
// });
//end testing message passing
console.log("background page started running");
let memory = {};
memory["total_num"] = "0";
memory["next_id"] = "0";
memory["id_list"] = [];
//all_quills contain [id] : [content] mappings
memory["all_quills"] = {};
let background_ready = false

chrome.storage.local.get(["total_num", "next_id", "id_list", "all_quills"], function(res_dict){
	console.log("memory[total_num] from chrome = " + res_dict["total_num"]);
	if(res_dict["total_num"] && parseInt(res_dict["total_num"]) > 0){
		memory["total_num"] = res_dict.total_num;
		console.log("already has memory " + memory["total_num"]);
		memory["next_id"] = res_dict.next_id;
		memory["id_list"] = [...res_dict.id_list];
	}
	let temp = JSON.stringify(res_dict.all_quills)
	console.log("temp =" + temp);
	memory["all_quills"] = JSON.parse(temp);
	background_ready = true;
});

function get_ready(){
	return background_ready;
}

function get_variables(var_list){
	ret = {}
	var_list.forEach(
		function(var_name){
			if(var_name == "total_num"){
				ret[var_name] = memory["total_num"];
				console.log("total num set eneted and set to " + memory["total_num"]);
			}
			else if(var_name == "next_id"){
				ret[var_name] = memory["next_id"];
			}
			else if(var_name == "id_list"){
				ret[var_name] = [...memory["id_list"]];
			}
			else if(var_name == "all_quills"){
				ret[var_name] = memory["all_quills"];
			}
		});
	console.log("ret = " + ret);
	let JSON_ret = JSON.stringify(ret);
	return JSON_ret;
}

function set_variables(var_list){
	console.log(var_list);
	memory = JSON.parse(var_list);
	chrome.storage.local.set(memory,function(){
		print_runtime_error();
		console.log("finished saving to chrome memory");
	})
}

function delete_quill_mem(id){
	delete memory["all_quills"][id];
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
