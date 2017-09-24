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

// get initial clan data
function getClanData() {
	$( "#getStats" ).button( "disable" );
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
			return;
		}
		clan.groupId = response.Response.detail.groupId;
		clan.name = response.Response.detail.name;
		clan.memberCount = response.Response.detail.memberCount;
		console.log('clan has ' + clan.memberCount + ' members');
		getClanMembers(clan);
	})
}

// get clan members
function getClanMembers (clan) {
	$.ajax({
		url: "https://www.bungie.net/platform/GroupV2/" + clan.groupId + "/Members/?currentPage=1",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting clan members');
			return;
		}
		clan.members = response.Response.results;
		console.log('got ' + clan.members.length + ' members');
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
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/" + membershipType + "/Profile/" + membershipId + "/?components=100",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting characters for ' + user.name);
			return;
		}
		user.characterIds = response.Response.profile.data.characterIds;
		user.characterCount = user.characterIds.length;
		console.log(user.name + ' has ' + user.characterCount + ' characters');
		for (var i = 0; i < user.characterCount; i++) {
			getActivityHistory(user, user.characterIds[i], 16); // get Nightfall games
			getActivityHistory(user, user.characterIds[i], 4);  // get Raids
			// getActivityHistory(user, user.characterIds[i], 39); // get Trials
		}
	})
}

function getActivityHistory (user, characterId, gameMode) {
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
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/Stats/PostGameCarnageReport/" + instanceId + "/",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (response.ErrorCode != 1) {
			console.log('something is borked getting pcgr for ' + user.name + ' for game id ' + instanceId);
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
	$( "#getStats" ).button( "enable" );

	var obj = {};
	obj.width = 400;
	obj.height = 800;
	obj.toolbar = {
                cls: 'pq-toolbar-export',
                items: [{
                        type: 'button',
                        label: "Export to Excel",
                        icon: 'ui-icon-document',
                        listeners: [{
                            "click": function (evt) {
                                $("#pqGrid").pqGrid("exportExcel", { url: "excel", sheetName: "pqGrid sheet" });
                            }
                        }]
                }]
            },
	obj.colModel = [
		{title:"Name", dataIndx: "name", width:200, dataType:"string"},
		{title:"NFs", dataIndx: "nfCount", width:100, dataType:"integer"},
		{title:"Raids", dataIndx: "raidCount", width:100, dataType:"integer"}
	];
	obj.dataModel = {data:users};
	$("#pqGrid").pqGrid( obj );
});


$(function() {
	$( "#dateStart" ).datepicker();
	$( "#dateEnd" ).datepicker();
	$( "#getStats" ).button();
  $( "#getStats" ).click( function( event ) {
		if ($("#dateStart").datepicker("getDate") == null || $("#dateEnd").datepicker("getDate") == null) {
			if ($("#dateStart").datepicker("getDate") == null) { $("#dateStart").focus(); } else { $("#dateEnd").focus(); }
			return false;
		}
    getClanData();
  });
});
