chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.sync.set({"next_id":"0"}, function(){
		console.log("next_id init fin");
	});
	chrome.storage.sync.set({"total_num":"0"}, function(){
		console.log("total_num init fin");
	});
});