chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.get("next_id", function(res){
		if(!res.next_id){
			chrome.storage.local.set({"next_id":"0", "total_num":"0", "id_list":[]}, function(){
				console.log("background set finished");
			});
		}
	});
})
