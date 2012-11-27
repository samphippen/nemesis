if (typeof(JSON) == "undefined") {
    JSON = {"parse": function(x) { return eval("(" + x + ")")}}
}

var token = "";
var current_email = "";
var current_userid = "";


var working_timer = null;
var working_count = 0;

function showWorking() {
    var text = "Working ";
    $("#working-alert").show();
    for (var i = 0; i < working_count % 4; i++) {
        text += ".";
    }

    $("#working-alert").text(text);
    working_count += 1;
}

function hideWorking() {
    $("#working-alert").fadeOut();
}


function show_spinner() {
    working_timer = setInterval(showWorking, 500);
}

function hide_spinner() {
    working_count = 0;
    clearInterval(working_timer);
    hideWorking();

}

if (window.location.hash != "") {
    window.location.hash = ""
}

var hash = window.location.hash

function handlehash(hash) {
    if (hash == "") {
        back();
    }

    if (hash == "college") {
        back();
    }
    if (hash.indexOf("show-") != -1) {
        var user = hash.slice(6,hash.length);
        show_edit(user)
    }

    if (hash.indexOf("register-users") != -1) {
        $("#college").hide();
        $("#register-users").show();
    }
}

setInterval(function(){
    if (window.location.hash != hash) {
        hash = window.location.hash;
        handlehash(hash)
    }
}, 100);

function populate_user(dict, userid) {
    $("#user-name").text(dict["full_name"]);
    $("#user-email").attr("value", dict["email"]);
    current_userid = userid;
    current_email = dict["email"];
}

var teams = null;

function add_registration_field() {
    build = "<tr class='register-row'>";
    build += "<td><input name='first-name' type='text'></input></td>";
    build += "<td><input name='last-name' type='text'></input></td>";
    build += "<td><input name='email' type='text'></input></td>";

    //build the select dropwodwn for teams
    build += "<td><select name='sel'>";
    for (var i = 0; i < teams.length; i++) {
        var team = teams[i];
        build +=      "<option value='" + team + "'>" + team + "</option>";
    }
    build += "</select></td>";
    build += "</tr>";

    //add the input to the table
    $("#register-inputs").append(build);
}

function register_details(hash) {
    hash["token"] = token
        $.post("user/register", hash);
}

function show_edit(userid) {
    show_spinner();
    $.get("user/" + userid, {"token":token}, function(response) {
        $("#college").hide();
        populate_user(JSON.parse(response), userid);
        $("#user").show();
        hide_spinner();
    });
}


function make_users_list(obj, list) {
    sorted = list.sort(function(a,b) { return a.user_name < b.user_name });
    html = "<ul>";
    for (var i = 0; i < sorted.length; i++) {
        var userid = list[i].userid;
        var user_name = list[i].user_name;
        html += "<li><a class='user' id='user-" + userid + "' href='#show-" + userid + "'>" + user_name + "</a></li>";
    }
    html += "</ul>"
    $("#college-users").html(html);
    for (var i = 0; i < obj["userids"].length; i++) {
        var userid = obj["userids"][i];
        $("#user-" + userid).onclick = function() {
            uid = this.id.split("-")[1];
            current_userid = uid;
            show_edit(uid);
        }
    }
}

var remaining = null;
var build = null;

function build_user_details(userid, obj) {
    $.get("user/" + userid, {"token":token}, function(resp) {
        var user_name = JSON.parse(resp)["full_name"];
        console.log(userid);
        build.push({"userid":userid, "user_name":user_name})
        remaining -= 1;
        if (remaining == 0) {
            make_users_list(obj, build);
            hide_spinner();
            $("#login").hide();
            $("#college").show();
        }
    });
}

function load_college_dialogue() {
    show_spinner();
    $.get("college", {"token":token}, function(resp) {
        var obj = JSON.parse(resp);
        if (teams == null) {
            teams = obj["teams"];
            add_registration_field();
        }
        $("#college-name").text(obj["college_name"]);
        build = []
        remaining = obj["userids"].length;
        console.log(obj["userids"]);
        for (var i = 0; i < obj["userids"].length; i++) {
            var userid = obj["userids"][i];
            build_user_details(userid, obj);
        }

    });
}

function back() {
    $("#user").hide();
    $("#register-users").hide();

    load_college_dialogue();
    current_userid = "";
}

function login() {
    var hash = {"username":$("#username").attr("value"), "password":$("#password").attr("value")};
    $.post("auth", hash, function(resp) {
        token = JSON.parse(resp)["token"];
        $("#error").text("Login Successful");
        load_college_dialogue();
    }).error(function(fail) {
        obj = JSON.parse(fail.responseText);
        if (obj["error"] == "invalid credentials") {
            $("#error").text("Username/password incorrect");
        } else if (obj["error"] == "not a teacher") {
            $("#error").text("You are not a teacher");
        } else if (obj["error"] == "not in a college") {
            $("#error").text("Your username is not associated with a college! Please contact us");
        } else {
            $("#error").text(obj["error"]);
        }
    });
}

$(document).ready(function() {
    $("#login").keyup(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            login();
        }
    });

    $("#username").focus(function() {
        text = $("#username").attr("value");
        if (text == "username") {
            $("#username").attr("value", "");
        }
    });

    $("#password").focus(function() {
        text = $("#password").attr("value");
        if (text == "password") {
            $("#password").attr("value", "");
        }
    });

    $(".back").click(function() {
        back();
    });

    $("#set").click(function() {
        opts = {};
        var empty = true;
        if ($("#user-email").attr("value") != current_email) {
            opts["email"] = $("#user-email").attr("value");
            empty = false;
        }

        if ($("#user-password").attr("value") != "") {
            opts["password"] = $("#user-password").attr("value");
            empty = false;
        }

        if (!empty && current_userid != "") {
            opts["token"] = token;
            $.post("user/" + current_userid, opts, function(resp) {
                back();
                $("#msg").text("User details updated successfully!");
            });
        }

        $("#user-password").attr("value", "");

    });

    $("#go").click(login);
    $("#show-register").click(function() {
        $("#college").hide();
        $("#register-users").show();
    });

    $("#add-row").click(add_registration_field);
    $("#send-register").click(function() {
        show_spinner();
        var rows = $(".register-row");
        $("#send-register").attr("disabled", "true");
        var text = $("#send-register").text()
        $("#send-register").text("Sending registrations...");
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var first_name = row.children[0].children[0].value;
            var last_name  = row.children[1].children[0].value;
            var email      = row.children[2].children[0].value;
            var team       = row.children[3].children[0].value;
            var hash = {"first_name":first_name,
                        "last_name" :last_name,
                        "email"     :email,
                        "team"      :team};

            if (first_name != "" && last_name != "" && email != "") {
                register_details(hash);
                if (i == rows.length-1) {
                    $("#msg").text("Users registered successfully!");
                }
            }
        }
        $("#send-register").removeAttr("disabled");
        $("#send-register").text(text);
        hide_spinner();
        back();
    });

});
