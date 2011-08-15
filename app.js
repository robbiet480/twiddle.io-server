
/**
 * Module dependencies.
 */

var express = require('express')
	app = express.createServer()
  , io = require('socket.io').listen(app);
// assuming io is the Socket.IO server object
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'twiddle.io'
  });
});

//app.listen(3000);
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});


// Storage

var users = {
  'asdfaasfa42432asdf' : {
    username      : 'Ankur Oberoi',
    password      : 'hello' 
  }
}

// Sockets stuff

io.sockets.on('connection', function (socket) {
	
	// ---- PHONE ----
	
	socket.on('phone-start', function (data) {
	  var user = users[data.UDID];
	  if (user == undefined) {
	    // not a known user
	  } else {
	    // known user, register phone socket
	    user.phoneSocket = socket;
	    if (user.webSocket) {
	      user.webSocket.emit('phone-arrive');
	    }
	  }
	});
	
	socket.on('recieve-message', function(data) {
	  user = users[data.UDID];
	  user.webSocket.emit('recieve-message', { sender : data.sender, message : data.message });
	});
	
	// ---- WEB ----
	
	socket.on('web-start', function (data) {
	  var user = users[data.UDID];
	  if (user == undefined) {
	    // not a known user
	  } else {
	    // known user, register web socket
	    user.webSocket = socket;
	    user.webSocket.emit('phone-arrive');
	    if (!user.phoneSocket) {
	      socket.emit('wait-phone');
	    }
	    console.log(socket);
	  }
	});
	
	socket.on('send-message', function(data) {
	  user = users[data.UDID];
	  if (user != undefined ) {
	    user.phoneSocket.emit('send-message', { recipient : data.recipient , message : data.message });
    } else {
      socket.emit('no-phone');
    }
	});
	
});



console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
