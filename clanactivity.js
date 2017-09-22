var clan = {
	groupId: '',
	name: '',
	memberCount: 0,
	members: [],
	membershipIds: []
}

var users = [];

// get initial clan data
$.ajax({
	url: "https://www.bungie.net/platform/GroupV2/Name/The%20Risen%20Guard/1/",
	dataType: "json",
	headers: {
		"X-API-Key": "61524efca0234043b54b290af933f1c6"
	}
}).done(function(response) {
	clan.groupId = response.Response.detail.groupId;
	clan.name = response.Response.detail.name;
	clan.memberCount = response.Response.detail.memberCount;
	console.log('clan has ' + clan.memberCount + ' members');
	getClanMembers(clan);
})

// get clan members
function getClanMembers (clan) {
	$.ajax({
		url: "https://www.bungie.net/platform/GroupV2/" + clan.groupId + "/Members/?currentPage=1",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		clan.members = response.Response.results;
		console.log('got ' + clan.members.length + ' members');
		for (var i = 0; i < clan.members.length; i++) {
    	users.push(clan.members[i]);
			clan.membershipIds.push(clan.members[i].destinyUserInfo.membershipId);
		}
		for (var i = 0; i < 5; i++) { //switch to users.length
			user = users[i];
			user.characterCount = 0;
			user.nightfalls = [];
			console.log(user.destinyUserInfo.displayName);
			getCharacterIds(user, users[i].destinyUserInfo.membershipId, users[i].destinyUserInfo.membershipType);
//			debugger;
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
		user.characterIds = response.Response.profile.data.characterIds;
		user.characterCount = user.characterIds.length;
		console.log(user.destinyUserInfo.displayName + ' has ' + user.characterCount + ' characters');
		for (var i = 0; i < user.characterCount; i++) {
			getActivityHistory(user, user.characterIds[i], 16) // get Nightfall games
		}
	})
}

function getActivityHistory (user, characterId, mode) {
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/" + user.destinyUserInfo.membershipType +
					"/Account/" + user.destinyUserInfo.membershipId + "/Character/" + characterId + "/Stats/Activities/?mode=" + mode,
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		if (typeof response.Response.activities === "undefined") { return; }
		for (i = 0; i < response.Response.activities.length; i++) {
			if (response.Response.activities[i].values.completed.basic.value &&
					playedWithClan(user.destinyUserInfo.membershipId, response.Response.activities[i].activityDetails.instanceId) ) {
				user.nightfalls.push(response.Response.activities[i]);
			}
		}
		console.log(user.destinyUserInfo.displayName + ' has completed ' + user.nightfalls.length + ' Nightfalls')
	})
}

function playedWithClan (membershipId, instanceId) {
	$.ajax({
		url: "https://www.bungie.net/platform/Destiny2/Stats/PostGameCarnageReport/" + instanceId + "/",
		dataType: "json",
		headers: {
			"X-API-Key": "61524efca0234043b54b290af933f1c6"
		}
	}).done(function(response) {
		for (i = 0; i < response.Response.entries.length, i++) {
			if (response.Response.entries[i])
		}
		debugger;
	})
}

$(function() {

	var apiKey = "61524efca0234043b54b290af933f1c6";
	var data;


    $("#jsGrid").jsGrid({
        width: "100%",
        height: "400px",

        sorting: true,
        paging: false,
				autoload: true,

				controller: {
            loadData: function() {
                var d = $.Deferred();

                $.ajax({
                    url: "https://www.bungie.net/platform/GroupV2/1989255/Members/?currentPage=1",
                    dataType: "json",
										headers: {
											"X-API-Key": apiKey
										}
                }).done(function(response) {
                    // console.log(response.Response.results);
                    d.resolve(response.Response.results);
                });

                return d.promise();
            }
        },

        fields: [
            { name: "destinyUserInfo", title: "Name", type: "text", width: 50,
										itemTemplate: function(destinyUserInfo){
											return destinyUserInfo.displayName;
										}
									},
						{ name: "destinyUserInfo", title: "Id", type: "text", width: 50,
										itemTemplate: function(destinyUserInfo){
											return destinyUserInfo.membershipId;
										}
									}
        ]
    });

});
