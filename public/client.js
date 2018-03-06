/*
	NAME:		Steven Champagne
	UCID:		10038946
	Tutorial:	B03 (MW@2PM)
*/

$(function () {

    // initial connection
    let socket = io();
    let $usernameLocation = $("#user-name");
    let $messages = $("#messages");
    let $userlist = $("#user-list"); // user list div element

    // new user (must change if cookies enabled)
    socket.emit("first connection");
    socket.emit("req history");

    // recieve chat history and put in chat window
    socket.on("chat history", function(history){
        console.log(history);
        for (let i = 0; i < history.length; i++){
            $messages.append('<li>'+parseOtherChatMessages(history[i]) + '</li>');
        }
        $messages.scrollTop($messages[0].scrollHeight);
    });

    // recieve username update
    socket.on("your nick update", function(newNickString){
        console.log("NICK UPDATED:", newNickString);
        $usernameLocation.html("You are "+newNickString);
        individualMessageFromServer(socket, newNickString);
    });

    // recieve the users list array and put it in the window.
    socket.on("update users list", function(usersArray){
        $userlist.html('');
        for (let i = 0; i < usersArray.length; i++){
            $userlist.append('<li>'+usersArray[i] + '</li>');        
        }
        $userlist.scrollTop($userlist[0].scrollHeight);
    });

    socket.on("nick rejected", function(data){
        // message from server
        individualMessageFromServer(socket, data);
    });

    socket.on("colour rejected", function(data){
        individualMessageFromServer(socket, data);
    });

    socket.on("your new colour", function(data){
        individualMessageFromServer(socket, data);
    });

    // hit enter in chat form triggers this
    $('form').submit(function () {

        let submittedMessage = $('#m').val()
        let splitMessage = submittedMessage.split(" ");

        //request nick change
        if((splitMessage[0].valueOf() === "/nick".valueOf()) && splitMessage[1]){
            socket.emit("request nick change", splitMessage[1]);
            $('#m').val('');
            return false;
        }
        else if((splitMessage[0].valueOf() === "/nickcolor".valueOf()) && splitMessage[1]){
            socket.emit("request colour change", splitMessage[1]);
            $('#m').val('');
            return false;
        }
        else if(splitMessage[0].valueOf() === "/help".valueOf()) {
            alert("use /nick <name> to change name.\nUse /nickcolor <RRGGBB> to change colour.");
            $('#m').val('');
            return false;
        }
        else{
            socket.emit('chat message', submittedMessage);
            $('#m').val('');
            return false;
        }
    });

    // recieve all chat messages back from server (including your own)
    socket.on('chat message', function (msg) {
        $messages.append('<li>'+parseOtherChatMessages(msg) + '</li>');
        $messages.scrollTop($messages[0].scrollHeight);
    });
    // bold your own messages
    socket.on("bold this", function(msg) {
        let boldedMessage = '<b>' + parseOtherChatMessages(msg) + '</b>';
        $messages.append('<li>'+ boldedMessage + '</li>');
        $messages.scrollTop($messages[0].scrollHeight);
    });
});

// used for invalid name changes and other invalid things
function individualMessageFromServer(socket, msg){
    $('#messages').append('<li style="background-color:powderblue;"><b style="color:red;">'+ "MESSAGE FROM SERVER: </b><i>" + msg + '</i></li>');
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
}

function parseOtherChatMessages(msg){
    console.log("message colour is: %s", msg.colour);

    // if it has a colour for name change it
    if(msg.colour != undefined){
        console.log("made it to defined colour...");
        return msg.time+ ' ' + '<c style="color:#' + msg.colour+'\";> ' + msg.nick + '</c>: ' + msg.msg;
    }
    // if no colour for name use default.
    else{
        console.log("made it to undefined colour");
        return msg.time+' '+msg.nick+': '+msg.msg;
    }
}

