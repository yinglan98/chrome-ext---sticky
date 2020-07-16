
let TEST_MODE = false;
let NO_SAVE = false;
print_details("TEST_MODE = " + TEST_MODE);
print_details("NO_SAVE = " + NO_SAVE);

let toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike', {'color':[]}, {'background':[]}],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }]
];

let img_options = ["cat_1.png", "fish_1.png", "fish_2.png", "train_1.png", "sheep_1.png", "sheep_2.png"];

let animation_dir = 1;

let map_id_quill = {};
let loc_total_num = "0";
let loc_next_id = "0";
//Note: loc_id_list stores a list of strings, not int!
let loc_id_list = [];
let reenter = false;
let back_page = chrome.extension.getBackgroundPage();


$(document).ready(function(){
	// test_persis();
	//$(document).focus();
	//wait for background page to set its variables
	while(!back_page.get_ready()){
		print_details("waiting for backround page");
	}
	print_details("background page ready");
	//chose a random background color for the page
	let color_num = rand_val(0, 360);
	let color_val = "hsla(" + color_num + ", 52%, 87%, 1)";
	document.querySelector("body").style.background = color_val;;
	add_anim();
	$(window).focus(function(){
		print_details("window.focus(): reenter = " + reenter);
		if(reenter){
			update_notes();
		}
	});
	$(window).blur(function(){
		reenter = true;
		store_notes();
	})
	window.addEventListener("beforeunload", store_notes);

	document.getElementById("create_note").addEventListener("click", function(){
		create_note();
	});

	// chrome.storage.local.get(["total_num", "next_id", "id_list"], function(res_dict){
	// 	print_runtime_error();
	let temp = back_page.get_variables(["total_num", "next_id", "id_list", "all_quills"]);
	let res_dict = JSON.parse(temp);
	print_details("document.ready(): res_dict = \n" + res_dict);
		//no notes yet - create new note
	let old_tot = parseInt(res_dict["total_num"]);
	if(old_tot === 0){
		print_details("document.ready(): old_tot === 0");
		//let new_tot = old_tot + 1;
		// chrome.storage.local.set(
		// 	{"next_id": "1", "total_num": "1", "id_list":["0"]}, function(){
		// 	print_runtime_error();
		// });
		loc_total_num = "1";
		loc_next_id = "1";
		loc_id_list = ["0"];

		//create new note with id
		create_note_helper("0");

	}

	//has prev saved notes -> new tab 
	else{
		print_details("document.ready(): old_tot != 0");
		// chrome.storage.local.get(res_dict.id_list, function(quill_cont){
			//updating local variables

			loc_total_num = res_dict.total_num;
			loc_next_id = res_dict.next_id;
			//copying array
			loc_id_list = [...res_dict.id_list];
			//TODO: update note when focused
			for(id of res_dict.id_list){
				//create html for note
				create_note_with_id(id);
				create_quill(id);
				let quill = map_id_quill[id];
				//set the content for the newly create note
				update_note(id, quill, res_dict["all_quills"]);
			}
		// });
	} //end else
	// });
});

/*
	Store the information of the note into browser memory

	Param id: {string} id for the note
	Param quill: {quill object} that contains the note
	Returns: None
*/
function store_notes_helper(id, quill){
	print_details("store_notes_helper called");
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	let note = document.getElementById("note"+id);
	let pos_top = get_pos_top(id);
	let pos_left = get_pos_left(id);
	let disp = document.getElementById("editor" + id).style.display;
	// chrome.storage.local.set({[id]:
	// 	{"content":quill.getContents(), "pos_top": [pos_top], "pos_left": [pos_left], "display": [disp]}}, function(){
	// 	print_runtime_error();
	// });
	return {"content":quill.getContents(), "pos_top": [pos_top], "pos_left": [pos_left], "display": [disp]};
}

/*
	Store the information of all the notes into browser memory
*/
function store_notes(){
	print_details("store_notes called");
	let to_be_stored = {};
	to_be_stored["all_quills"] = {};
	for (const id in map_id_quill){
		// console.log("id = " + id);
		let quill = map_id_quill[id];
		//to_be_stored["0"] = "random";
		to_be_stored["all_quills"][id] = store_notes_helper(id, quill);
	}
	to_be_stored["total_num"] = loc_total_num;
	to_be_stored["next_id"] = loc_next_id;
	to_be_stored["id_list"] = loc_id_list;
	if(!NO_SAVE){
		// chrome.storage.local.set(to_be_stored ,function(){
		// 	print_runtime_error();
		// })
		print_details("store notes - JSON.stringify(to_be_stored");
		print_details(JSON.stringify(to_be_stored));
		back_page.set_variables(JSON.stringify(to_be_stored));
	}
}

/*
	Create the related HTML elements for a note with the given ID
	This is a helper function used in create_note_helper()
	Param id: {string} id of the note
*/
function create_note_with_id(id){
	print_details("create_note_with_id called");
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	let div_str = "<div class='one_note' id='note" + id + "'></div>";
	let one_note_div = $(div_str);
	one_note_div.draggable({
			handle:"#drag", 
			containment: "parent"
	});
	let drag = $("<span id='drag'></span>");
	let del_button = $("<button class = 'del_button'> x </button>");
	let min_button = $("<button class = 'min_button'> - </button>");
	del_button.click(delete_note);
	min_button.click(change_dis);
	let editor_str = "<div id='editor" + id + "'></div>";
	let editor = $(editor_str);
	one_note_div.append(drag);
	drag.append(min_button);
	drag.append(del_button);
	one_note_div.append(editor);
	$("body").append(one_note_div);
	document.getElementById("note"+id).style.position = "fixed";
}

/*
	Create Quill and related updates for the newly created note
	Create the HTML side as well
	Param: {string} id of the note
*/
function create_note_helper(id){
	print_details("create_note_helper called with id = " + id);
	//console.log("helper");
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	create_note_with_id(id);
	create_quill(id);
 //  	let quill = map_id_quill[id];
 //  	let pos_top = get_pos_top(id);
 //  	let pos_left = get_pos_left(id);

	// chrome.storage.local.set({[id]: 
	// 	{"content": quill.getContents(), "pos_top": [pos_top], "pos_left": [pos_left]}}, function(){
	// 	print_runtime_error();
	// });	
}

/*
	called when the user click the create ntoe button
*/
function create_note(){
	print_details("create_note called");
	// chrome.storage.local.get(["total_num", "next_id", "id_list"], function(res){
	// 	print_runtime_error();
	// 	let new_tot = (parseInt(res.total_num) + 1).toString();
	// 	let new_id = (parseInt(res.next_id) + 1).toString();
	// 	let new_note_id = res.next_id.toString();
	// 	(res.id_list).push(new_note_id)
	// 	chrome.storage.local.set(
	// 		{"total_num": new_tot, "next_id": new_id, "id_list": res.id_list}, function(){
	// 			print_runtime_error();
	// 			//console.log("create note fin update");
	// 			create_note_helper(new_note_id);
	// 	});
	// });
	create_note_helper(loc_next_id);
	loc_total_num = (parseInt(loc_total_num) + 1).toString();
	loc_id_list.push(loc_next_id);
	loc_next_id = (parseInt(loc_next_id) + 1).toString();
	if(TEST_MODE){
		console.assert(parseInt(loc_total_num) === loc_id_list.length);
		console.assert(parseInt(loc_total_num) === Object.keys(map_id_quill).length);
	}
}

/*

	This serves as helper function to update notes
	Param: {string} id of the note to be updated
	Param: {quill object} quill object associated with that note
*/

function update_note(id, quill, quill_cont){
	print_details("update_note called: quill_cont param = \n" + quill_cont);
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	// chrome.storage.local.get(id, function(quill_cont){
	//print_runtime_error();
	quill.setContents(quill_cont[id].content);
	let note = document.getElementById("note"+id);
	note.style.top = quill_cont[id]["pos_top"];
	note.style.left = quill_cont[id]["pos_left"];
	let editor = document.getElementById("editor"+id);
	editor.style.display = quill_cont[id]["display"];
	// });
}
/*
	when the user get to the new tab page after being away, the page needs to be updated with 
	the most recent info
*/
function update_notes(){
	// chrome.storage.local.get(["id_list", "total_num", "next_id"], function(id_list_res){
		//print_runtime_error();
		// chrome.storage.local.get(id_list_res.id_list, function(content_res){
		// 	console.log("content_res: " + content_res);
	print_details("update_notes called");
	let temp = back_page.get_variables(["total_num", "next_id", "id_list", "all_quills"]);
	print_details("update_notes: get_variables returned: \n" + temp);
	let res_dict = JSON.parse(temp);

	(res_dict.id_list).forEach(id =>{
		//note id already exists
		if(TEST_MODE){
			console.assert(typeof(id) === "string");
		}
		if (id in map_id_quill){
			//console.log("update note - note with id = " + id + "already exists");
			let quill = map_id_quill[id];
			print_details("res_dict.all_quills = " + res_dict.all_quills);
			update_note(id, quill, res_dict.all_quills);
		}
		//Tab is out of date - need to create new note
		else{
			create_note_with_id(id);
			create_quill(id);
			print_details("res_dict.all_quills = " + res_dict.all_quills);
				update_note(id, map_id_quill[id], res_dict.all_quills);
		}
	}); //end of for each
	//delete from map_id_quill what has already been deleted
	for (let id in map_id_quill){
		if(!res_dict.id_list.includes(id)){
			delete_note_helper(id);
		}
	}

	//update local var
	loc_id_list = [...res_dict.id_list];
	loc_next_id = res_dict.next_id;
	loc_total_num = res_dict.total_num;
		// });
	if(TEST_MODE){
		console.assert(parseInt(loc_total_num) === loc_id_list.length);
		console.assert(parseInt(loc_total_num) === Object.keys(map_id_quill).length);
	}
	// });
}

/*
	helper of delete_note: remove the note from HTML
	param: {string} id of the note to be removed

*/
function delete_note_helper(id){
	print_details("delete_note _helper called: to delete id = " + id);
	delete map_id_quill[id];
	let elt_to_delete = document.querySelector("#note" + id);
	elt_to_delete.parentNode.removeChild(elt_to_delete);
}

/*
	called when user clicks delete note button
	param: {event} the button click event
*/
//Note: the way to get id is dependent on the HTML structure of the note
function delete_note(e){
	print_details("delete_note called");
	//detect which note id to delete\
    let str_id = e.target.parentElement.parentElement.id;
    //Note: somewhat hardcoded
    let id = str_id.substring(4);

    //update related values
 //    chrome.storage.local.get(["total_num", "id_list"], function(res_tot){
	// //find the index of the id in id_list
	// 	let ind = res_tot.id_list.findIndex(elt => elt == id);
	// 	console.log("ind to be deleted = " + ind);
	// 	console.assert(ind !== -1);
	// 	//remove that index
	// 	res_tot.id_list.splice(ind, 1);
 //    	// chrome.storage.local.set(
 //    	// 	{"total_num": (parseInt(res_tot.total_num) - 1).toString(), "id_list": res_tot.id_list}, function(){
 //    	// 		chrome.storage.local.remove([id], function(){
 //    	// 				delete_note_helper(id);
 //    	// 			})
 //    	// });
 //    });

    loc_total_num = (parseInt(loc_total_num) - 1).toString();
   	let ind = loc_id_list.findIndex(elt => elt == id);
   	if(TEST_MODE){
	   	console.assert(ind !== -1);
	}
   	loc_id_list.splice(ind, 1);
   	delete_note_helper(id);
   	// chrome.storage.local.remove([id], function(){
    // 	//delete_note_helper(id);
    // })
    back_page.delete_quill_mem(id);
    if(TEST_MODE){
		console.assert(parseInt(loc_total_num) === loc_id_list.length);
		console.assert(parseInt(loc_total_num) === Object.keys(map_id_quill).length);
	}
}

/*
	return the note's style.top
	param: {id} the note's id
*/
function get_pos_top(id){
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	let note = document.getElementById("note"+id);
	return note.style.top;
}

/*
	return the note's style.left
	param: {string} the note's id
*/
function get_pos_left(id){
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	let note = document.getElementById("note"+id);
	return note.style.left;
}

/*
	called when user clicks the minimization button for a note
	param: {event} button click event of the minimization button
*/
function change_dis(e){
	let str_id = e.target.parentElement.parentElement.id;
	//Note: somewhat hardcoded
	let id = str_id.substring(4);
	let editor = document.getElementById("editor"+id);
	if(editor.style.display === "none"){
		editor.style.display = "block";
	}
	else{
		editor.style.display = "none";
	}
}

/*
	helper function to create a new quill given the id
	param: {string} id of the html element that the quill object should link to
*/
function create_quill(id){
	if(TEST_MODE){
		console.assert(typeof(id) === "string");
	}
	map_id_quill[id] = new Quill("#editor"+id, {
		modules:{
			toolbar: toolbarOptions
		},
		theme: 'snow'
	});
}

/*
	helper function that return a random number between min and max - inclusive on both ends
	param: {int} lower bond of the interval
	param: {int} upper bond of the interval
*/
function rand_val(min, max){
	return min + Math.floor((max-min+1) * Math.random());
}

// function rand_color(min, max){
// 	let color_num = rand_val(min, max);
// 	// let color_str = color_num.toString(16);
// 	// return "#"+color_str;
// }
/*
	a helper function to move_anim. This function gets repearely called and move the
	img element back and forth
*/
function move_anim_helper(){
	let img = document.getElementById("img");
	let img_left_str = img.style.left;
	let img_left_num = parseInt(img_left_str.substring(0, img_left_str.length - 2));
	if(img_left_num >= 0.70 * window.innerWidth - parseInt(img.offsetWidth)){
		animation_dir = -1;
		img.style.transform = "scaleX(-1)";
	}
	else if(img_left_num < 0.30 * window.innerWidth){
		img.style.transform = "scaleX(1)";
		animation_dir = 1;
	}
	img_left_num += (3* animation_dir);
	img.style.left = img_left_num.toString() + "px";
}
/*
	move the img elt
*/ 
function move_anim(){
	let img = document.getElementById("img");
	img.style.position = "fixed";
	let left_dist = 0.30*window.innerWidth;
	img.style.left = left_dist.toString() + "px";
	let top_dist = 0.40 * window.innerHeight;
	img.style.top = top_dist.toString() + "px";
	img.style.width = "10%";
	setInterval(move_anim_helper, 30);
}
/*
	randomly chooses an image add attach it to the html
*/
function add_anim(){
	//chose a random image
	let img_id = rand_val(0, img_options.length - 1);
	//add img to html
	let anim_img = $("<img src = 'images/" + img_options[img_id] + "' id='img'>");
	$("body").append(anim_img);
	move_anim();
}

/*
	prints out the id_list from chrome storage to check
	used to check if memory is persistent across updates.
*/
function test_persis(){
	chrome.storage.local.get("id_list", function(res_dict){
	    console.log(res_dict.id_list);
	});
}

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