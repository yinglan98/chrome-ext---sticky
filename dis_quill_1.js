var map_id_quill = {};
$(document).ready(function(){
	console.log("doc ready");
	//TODO: currently map_id_quill is not used -> if no need at end -> delete and update rest of code
	$(window).focus(function(){
		update_notes();
	});
	$(window).blur(function(){
		store_notes();
	})
	window.addEventListener("beforeunload", store_notes);
	//Note: next line is same as getElementbyId.addEventListener()...
	// $("#create_note").click(function(){
	// 	console.log("create note clicked");
	// 	create_note();
	// });
	document.getElementById("create_note").addEventListener("click", function(){
		console.log("create note clicked");
		create_note();
	});

	chrome.storage.local.get("total_num", function(tot_num){
		print_runtime_error();
		//no notes yet - create new note
		let old_tot = parseInt(tot_num.total_num);
		//console.log("old_tot = ", old_tot);
		if(old_tot === 0){
			console.log("no notes to start with");
			let new_tot = old_tot + 1;
			chrome.storage.local.set({"next_id": "1"}, function(){
				print_runtime_error();
			});
			chrome.storage.local.set({"total_num": "1"}, function(){
				print_runtime_error();
			});
			chrome.storage.local.set({"id_list":["0"]}, function(){
				print_runtime_error();
			});
			//create new note with id
			create_note_helper("0");

		}

		//has prev saved notes -> new tab 
		else{
			//console.log("TODO: handle ext update");
			chrome.storage.local.get("id_list", function(res_dict){
				print_runtime_error();
				//TODO: update note when focused
				for(id of res_dict.id_list){
					//console.log(id);
					//create html for note
					create_note_with_id(id);
					map_id_quill[id] = new Quill("#editor"+id, {
						theme: 'snow'
					});
					let quill = map_id_quill[id];
					//set the content for the newly create note
					update_note(id, quill);
					//attach event for the newly created note
					let len = document.getElementsByClassName("ql-editor").length;
					// document.getElementsByClassName("ql-editor")[len-1].addEventListener("blur", function(){
					// 	store_note(id, quill);
					// });
					// document.getElementsByClassName("ql-editor")[len-1].addEventListener("focus", function(){
					// 	update_note(id, quill);
					// });
				}
			}) //end let
		} //end else
	});
});


function store_note(id, quill){
	console.log("STORE");
	chrome.storage.local.set({[id]:quill.getContents()}, function(){
		print_runtime_error();
	});
}

function store_notes(){
	for (var key in map_id_quill){
		let quill = map_id_quill[key];
		store_note(key, quill);
	}
}

/*
	Given an ID, creates the related HTML elements with that ID
*/
function create_note_with_id(id){
	console.log("create_note with id called");
	console.assert(typeof(id) === "string");
	let div_str = "<div class='one_note' id='note" + id + "'></div>";
	let one_note_div = $(div_str);
	one_note_div.draggable({
			handle:"#drag"
	});
	let drag = $("<span id='drag'> AHHHHHHHHHH </span>");
	let del_button = $("<button class = 'del_button'> x </button>");
	del_button.click(delete_note);
	let editor_str = "<div id='editor" + id + "'></div>";
	let editor = $(editor_str);
	one_note_div.append(drag);
	one_note_div.append(del_button);
	one_note_div.append(editor);
	$("body").append(one_note_div);
}

/*
	Create Quill + related updates for the newly created note
	Create the HTML side as well
	NOTE: id should be a STRING
*/
function create_note_helper(id){
	console.log("helper");
	console.assert(typeof(id) === "string");
	create_note_with_id(id);
	map_id_quill[id] = new Quill("#editor" + id, {
    	theme: 'snow'
  	});
  	let quill = map_id_quill[id];
	chrome.storage.local.set({[id]: quill.getContents()}, function(){
		print_runtime_error();
		//console.log("Note " + id + "created - contents saved");
		//console.log(quill.getContents());
	});	
}

function update_note(id, quill){
	console.log("update_note called");
	chrome.storage.local.get(id, function(quill_cont){
		print_runtime_error();
		//console.log("quill content: ", quill_cont);
		quill.setContents(quill_cont[id]);
	});
}

//TODO: Need to change to handle delete -> take out the deleted id from map_id_quill
function update_notes(){
	chrome.storage.local.get("id_list", function(id_list_res){
		print_runtime_error();
		(id_list_res.id_list).forEach(id =>{
			//note id already exists
			console.assert(typeof(id) === "string");
			if (id in map_id_quill){
				console.log("update note - note with id = " + id + "already exists");
				let quill = map_id_quill[id];
				update_note(id, quill);
			}
			//Tab is out of date - need to create new note
			else{
				console.log("update note - id = " + id + "doesn't exist");
				create_note_with_id(id);
				map_id_quill[id] = new Quill("#editor" + id, {
		    		theme: 'snow'
  				});
  				update_note(id, map_id_quill[id]);
			}
		}); //end of for each
		//delete from map_id_quill what has already been deleted
		//TODO: to be tested
		for (let id in map_id_quill){
			if(!id_list_res.id_list.includes(id)){
				delete_note(id);
			}
		}
	});

}

function create_note(){
	console.log("create_note called");
	chrome.storage.local.get("total_num", function(res){
		print_runtime_error();
		let new_tot = (parseInt(res.total_num) + 1).toString();
		chrome.storage.local.set({"total_num": new_tot}, function(){
			print_runtime_error();
			//console.log("create: total_num updated");
			console.log("create_note: new total_num = ", (parseInt(res.total_num) + 1).toString());
			chrome.storage.local.get("next_id", function(next_id_res){
				print_runtime_error();
				chrome.storage.local.set({"next_id":(parseInt(next_id_res.next_id) + 1).toString()}, function(){
					print_runtime_error();
					//console.log("create: next_id updated");
					let new_note_id = parseInt(next_id_res.next_id);
					chrome.storage.local.get("id_list", function(id_list_result){
						print_runtime_error();
						id_list_result.id_list.push(new_note_id.toString());
						chrome.storage.local.set({"id_list":id_list_result.id_list}, function(){
							print_runtime_error();
							console.log("entered");
	 						create_note_helper(new_note_id.toString());
						});
					}); //okay
				}) //okay
			}); //okay
		}); //okay
	})
}

//Note: the way to get id is dependent on the HTML structure of the note
function delete_note(e){
	//console.log("delete note clicked");
	//detect which note id to delete
    let str_id = e.target.parentElement.childNodes[3].id;
    let id = str_id.substring(6);
    //console.log("del note id = " + id);

    //update related values
    chrome.storage.local.get("total_num", function(res_tot){
    	chrome.storage.local.set({"total_num" : (parseInt(res_tot.total_num) - 1).toString()}, function(){
    		chrome.storage.local.get("id_list", function(res_id_list){
    			//find the index of the id in id_list
    			ind = res_id_list.id_list.findIndex(elt => elt == id);
    			console.log("ind to be deleted = " + ind);
    			console.assert(ind !== -1);
    			//remove that index
    			res_id_list.id_list.splice(ind, 1);
    			chrome.storage.local.set({"id_list": res_id_list.id_list}, function(){
    				chrome.storage.local.remove([id], function(){
    					delete map_id_quill[id];
    					console.log("id = " + id);
    					let elt_to_delete = document.querySelector("#note" + id);
    					elt_to_delete.parentNode.removeChild(elt_to_delete);
    				})
    			});
    		});
    	});
    });
}

function print_runtime_error(){
	if(chrome.runtime.lastError){
		console.log(chrome.runtime.lastError.message);
	}
}

