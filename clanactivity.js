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
                    console.log(response.Response.results);
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
