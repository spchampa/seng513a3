/*
	NAME:		Steven Champagne
	UCID:		10038946
	Tutorial:	B03 (MW@2PM)
*/

let express = require('express');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let path = require('path');


// define the response object
let usrMsg = {
    msg : "",
	time : "" ,
	nick : "",
    colour: ""
};

// define global variables
let guestNumber = 1;
let chatHistory = [];
let maxChatHistory = 200;
let userList = [];



// Start the server
let listener = server.listen(process.env.PORT || 3000);
console.log('Server Running on port %s', listener.address().port)


// Serve the Client
app.use(express.static(path.join(__dirname, '/public')));


// connect disconnect messages to console
io.on('connection', function (socket) {
	console.log('a user connected');

	// user disconnects --> remove from userlist
	socket.on('disconnect', function () {
		console.log('user disconnected');
		deleteUserFromUserList(socket.nick);
	});
});

// catch the socket chat
io.on('connection', function (socket) {

	// initial connection --> assigned a username.
	socket.on("first connection", function(){
		socket.nick = initialUniqueUserName();
		console.log("A user has connected for their first time. Username: %s", socket.nick);
		socket.emit("your nick update", socket.nick);
		updateUserList(socket.nick);
	});


	// initial connection --> send chat history
	socket.on("req history", function(){
		if (chatHistory.length) {
			console.log(chatHistory);
			socket.emit('chat history', chatHistory);   
		}
		else{
			// do nothing i guess...
		}
	});


	socket.on('chat message', function (msg) {
		// recieve message from user
		usrMsg.time = getHMS_String(getDateTime());
		usrMsg.msg = msg;
		usrMsg.nick = socket.nick;
		usrMsg.colour = socket.colour;
		
		// test output, delete later.
		console.log("RECIEVED: " + parseMsg(socket, usrMsg));

		// send the message back to be bolded
		socket.emit("bold this", usrMsg);
		//message everone else regularly.
		socket.broadcast.emit('chat message', usrMsg);
		addMsgToHistoryObject(usrMsg);		
	});

	// user has requested name change
	socket.on("request nick change", function(newName){
		console.log("NICK CHANGE REQUEST FROM: %s", socket.nick);
		console.log("WANTS TO CHANGE NICK TO: %s", newName);
		if(newName){
			if(checkUnique(newName)){
				deleteUserFromUserList(socket.nick);
				socket.nick = newName;
				socket.emit("your nick update", socket.nick);
				updateUserList(newName);
				console.log("NAME SHOULD HAVE CHANGED!");
			}
			else{
				socket.emit("nick rejected", "NICK REJECTED: Username \'" + newName + "\' Unavailable.");
			}
		}
		else{
			// note: the program never actually gets here.
			socket.emit("nick rejected", "Use format: /nick <username> (no spaces allowed)");
		}
	});

	// user has requested new nick colour
	socket.on("request colour change", function(newColour){
		console.log("Nick Colour Change Request From: %s", socket.nick);
		console.log("Change Colour To: %s", newColour);
		// test if legitamate format: RRGGBB, and corresponds to colour....
		// test if 6 chars long
		// test if each char is hex
		if(/^[0-9A-F]{6}$/i.test(newColour)){
			console.log("New colour passed test...");
			socket.colour = newColour;
			socket.emit("your new colour", "Colour change accepted: "+"<c style=\'color:#" + socket.colour + ";\'>" + socket.nick + "</c>");
		}
		else{
			console.log("colour change rejected: " + newColour)
			socket.emit("colour rejected", "Colour Rejected: \'" + newColour + "\' Not Valid.")
		}
	});


});

// // broadcast (from original socket.io tutorial)
// io.on('connection', function (socket) {
// 	socket.on('chat message', function (msg) {
// 		io.emit('chat message', msg);
// 	});
// });


// Adds the message to the history log. New Version.
function addMsgToHistoryObject(msg){

	// very annoying problem where .push doesn't work because only the reference to the object is passed....
	// So I need to copy the object.
	let copyofmsg = {};
	copyofmsg.msg = msg.msg;
	copyofmsg.nick = msg.nick;
	copyofmsg.colour = msg.colour;
	copyofmsg.time = msg.time;

	// if chatlog length is greater or equal to 200 
	if (chatHistory.length >= maxChatHistory){
		while(chatHistory.length >= maxChatHistory){
			console.log("inside shift zone"); //del
			chatHistory.shift();
		}	
	}
	chatHistory.push(copyofmsg);
	//console.log(chatHistory); // testing delete later..
}

// parses a message from the user message object
function parseMsg(socket, msgObj){
	// add colour later
	return msgObj.time+' '+socket.nick+': '+usrMsg.msg
}

// updates the user array and emits the user list to the channel
function updateUserList(sName){
	userList.push(sName);

	io.emit("update users list", userList);

}

// finds the username in the list and deletes it --> emits new list to channel
function deleteUserFromUserList(sNick){

	// find and delete
	for (let i = userList.length - 1; i >= 0; i--) {
		if (userList[i] === sNick) {
			userList.splice(i, 1);
			// break;       //<-- Uncomment  if only the first term has to be removed
		}
	}
	io.emit("update users list", userList);

}

// check if username is unique. if unique return true, if in list already return false
function checkUnique(name){
	if(userList.indexOf(name) == -1){
		return true;
	}
	return false;
}

// first time user gets a new name.
function initialUniqueUserName(){
	let name = "Guest"+guestNumber;
	while(!checkUnique(name)){
		console.log(name + "WAS NOT UNIQUE.")
		guestNumber++;
		name = "Guest"+guestNumber;
			
	}
	return name
}

//
function getHMS_String(datetime){
	let h = datetime.hour;
	let m = datetime.min;
	let s = datetime.sec;
	return h + ":" + m + ":" + s;
}

//
function getDateTime() {
	let d = {hour:'',min:'',sec:'',year:'',month:'',day:''}
    let date = new Date();
    let hour = date.getHours();
    d.hour = (hour < 10 ? "0" : "") + hour;
    let min  = date.getMinutes();
    d.min = (min < 10 ? "0" : "") + min;
    let sec  = date.getSeconds();
    d.sec = (sec < 10 ? "0" : "") + sec;
    d.year = date.getFullYear();
    let month = date.getMonth() + 1;
    d.month = (month < 10 ? "0" : "") + month;
    let day  = date.getDate();
    d.day = (day < 10 ? "0" : "") + day;
    return d;
}




