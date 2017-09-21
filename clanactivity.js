var clan = {
	groupId: '',
	name: '',
	memberCount: 0,
	members: []
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
		}
		for (var i = 0; i < users.length; i++) {
			user = users[i];
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
		console.log(user.destinyUserInfo.displayName);
		user.characterIds = response.Response.profile.data.characterIds;
		user.characterCount = user.characterIds.length;
		console.log(user.destinyUserInfo.displayName + ' has ' + user.characterCount + ' characters');
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
