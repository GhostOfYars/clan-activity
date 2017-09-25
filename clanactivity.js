var clan = {
	groupId: '',
	name: '',
	memberCount: 0,
	members: [],
	membershipIds: []
}

var users = [];
var startDate = new Date();
var endDate = new Date();
var apiErrors = [];

// get initial clan data
function getClanData() {
	$("#statusLog").append("<span>Getting clan member count</span><br>");
	$("#getStats").button("disable");
	startDate = $("#dateStart").datepicker("getDate");
	endDate = $("#dateEnd").datepicker("getDate");
	startDate.setUTCHours(9);
	endDate.setUTCHours(9);
	$.ajax({
		url: "https://www.bungie.net/platform/GroupV2/Name/The%20Risen%20Guard/1/",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting clan data');
			$("#statusLog").append("<span class='errspan'>There was an error with the API</span><br>");
			apiErrors.push(response);
			return;
		}
		clan.groupId = response.Response.detail.groupId;
		clan.name = response.Response.detail.name;
		clan.memberCount = response.Response.detail.memberCount;
		console.log('clan has ' + clan.memberCount + ' members');
		$("#statusLog").append("<span>Clan has " + clan.memberCount + " members</span><br>");
		getClanMembers(clan);
	})
}

// get clan members
function getClanMembers (clan) {
	$("#statusLog").append("<span>Retrieving list of clan members</span><br>");
	$.ajax({
		url: "https://www.bungie.net/platform/GroupV2/" + clan.groupId + "/Members/?currentPage=1",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting clan members');
			$("#statusLog").append("<span class='errspan'>Unable to retrieve list of clan members</span><br>");
			apiErrors.push(response);
			return;
		}
		clan.members = response.Response.results;
		console.log('got ' + clan.members.length + ' members');
		$("#statusLog").append("<span>Clan member list retrieved</span><br>");
		for (var i = 0; i < clan.members.length; i++) {
    	users.push(clan.members[i]);
			clan.membershipIds.push(clan.members[i].destinyUserInfo.membershipId);
		}
		for (var i = 0; i < users.length; i++) { //switch to users.length
			var user = users[i];
			user.characterCount = 0;
			user.name = user.destinyUserInfo.displayName;
			user.nfCount = 0;
			user.raidCount = 0;
			user.nightfalls = [];
			user.raids = [];
			user.trials = [];
			getCharacterIds(user, users[i].destinyUserInfo.membershipId, users[i].destinyUserInfo.membershipType);
		}
	})
}

function getCharacterIds (user, membershipId, membershipType) {
	$("#statusLog").append("<span>Getting characters for " + user.name + "</span><br>");
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/" + membershipType + "/Profile/" + membershipId + "/?components=100",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting characters for ' + user.name);
			$("#statusLog").append("<span class='errspan'>Failed to get characters for " + user.name + "</span><br>");
			apiErrors.push(response);
			return;
		}
		user.characterIds = response.Response.profile.data.characterIds;
		user.characterCount = user.characterIds.length;
		console.log(user.name + ' has ' + user.characterCount + ' characters');
		$("#statusLog").append("<span>" + user.name + " has " + user.characterCount + " characters</span><br>");
		for (var i = 0; i < user.characterCount; i++) {
			getActivityHistory(user, user.characterIds[i], 16); // get Nightfall games
			getActivityHistory(user, user.characterIds[i], 4);  // get Raids
			// getActivityHistory(user, user.characterIds[i], 39); // get Trials
		}
	})
}

function getActivityHistory (user, characterId, gameMode) {
	$("#statusLog").append("<span>Getting activities for " + user.name + "</span><br>");
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/" + user.destinyUserInfo.membershipType +
					"/Account/" + user.destinyUserInfo.membershipId + "/Character/" + characterId + "/Stats/Activities/?mode=" + gameMode,
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting activity history for ' + user.name);
			$("#statusLog").append("<span class='errspan'>Failed to get activities for " + user.name + "</span><br>");
			apiErrors.push(response);
			return;
		}
		if (typeof response.Response.activities === "undefined") { return; }
		for (var i = 0; i < response.Response.activities.length; i++) {
			var activityDate = new Date(response.Response.activities[i].period);
			if (response.Response.activities[i].values.completed.basic.value &&
					startDate < activityDate && endDate > activityDate) {
				playedWithClan(user, user.destinyUserInfo.membershipId, response.Response.activities[i].activityDetails.instanceId, gameMode);
			}
		}
	})
}

function playedWithClan (user, membershipId, instanceId, gameMode) {
	$("#statusLog").append("<span>Getting PGCR for " + instanceId + "</span><br>");
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/Stats/PostGameCarnageReport/" + instanceId + "/",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting pcgr for ' + user.name + ' for game id ' + instanceId);
			$("#statusLog").append("<span class='errspan'>Failed to get PCGR for " + instanceId + "</span><br>" +
				"<a class='errspan' href='http://destinytracker.com/d2/pgcr/'" + instanceId + ">Get report on DestinyTracker</a><br>");
			apiErrors.push(response);
			return;
		}
		for (var i = 0; i < response.Response.entries.length; i++) {
			if (response.Response.entries.length == 1 ||
					$.inArray(response.Response.entries[i].player.destinyUserInfo.membershipId, clan.membershipIds) == -1) {
				console.log('pWC: Fireteam had non-clan members');
				return;
			}
		}
		console.log('pWC: Fireteam was all clan members');
		switch(gameMode) {
    case 4:
      user.raids.push(response.Response);
			user.raidCount++;
      break;
    case 16:
      user.nightfalls.push(response.Response);
			user.nfCount++;
      break;
		/*case 39:
			user.trials.push(response.Response);
			break;*/
    default:

		}
	})
}

$(document).ajaxStop(function() {
	console.log('all calls have returned');
	$("#pqGrid").pqGrid("hideLoading");
	if (apiErrors.length > 0) {
		alert('There were some errors.  Check the status log and debug console');
		console.log(apiErrors);
	}
	$("#getStats").button("enable");
	$("#pqGrid").pqGrid("option", "dataModel.data", users);
	$("#pqGrid").pqGrid("refreshDataAndView");
});


$(function() {
	$( "#dateStart" ).datepicker();
	$( "#dateEnd" ).datepicker();
	$( "#getStats" ).button();
	var obj = {};
	obj.width = 500;
	obj.height = 800;
	obj.editable = false;
	obj.selectionModel = {
		type: 'row',
		mode: 'block',
		all: true
	}
	obj.colModel = [
		{title:"Name", dataIndx: "name", width:200, dataType:"string"},
		{title:"NFs", dataIndx: "nfCount", width:100, dataType:"integer"},
		{title:"Raids", dataIndx: "raidCount", width:100, dataType:"integer"}
	];
	obj.dataModel = {data:users};
	$("#pqGrid").pqGrid( obj );
  $( "#getStats" ).click( function( event ) {
		if ($("#dateStart").datepicker("getDate") == null || $("#dateEnd").datepicker("getDate") == null) {
			if ($("#dateStart").datepicker("getDate") == null) { $("#dateStart").focus(); } else { $("#dateEnd").focus(); }
			return false;
		}
		users = [];
		$("#pqGrid").pqGrid("showLoading");
		$("#statusLog > span, #statusLog > a, #statusLog > br").remove();
		getClanData();
  });
});
