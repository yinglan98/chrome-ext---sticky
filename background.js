chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.set({"next_id":"0"}, function(){
		console.log("next_id init fin");
	});
	chrome.storage.local.set({"total_num":"0"}, function(){
		console.log("total_num init fin");
	});
});