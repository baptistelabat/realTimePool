// Configuration part
var fs = require('fs');
var conf = {port : 8080};

// Server part
var connect = require('connect');
console.log(__dirname);
console.log(process.cwd());
var app = connect.createServer(
    connect.static(process.cwd())
).listen(conf.port);
console.log('Start server on port : '+conf.port);

// Define socket part
var io   = require('socket.io');
var wsServer = io.listen(app);
var t0 = new Date().getTime();

// Clients will contain all the clients connected
var clients = {};
var mean;
var N, N0, N1, N2, N3, N4, N5;
wsServer.sockets.on('connection', function(socket) {
	clients[socket.id] = {vote:50}; // Initialize vote at mid range
	console.log('### connection');
    socket.on('vote', function(message) {
		console.log("Message received");
		console.log(message);
		var t = new Date().getTime()-t0;
        clients[socket.id].vote = message; // Save the vote of the client
        var n = 0;
        var n0 = 0;
        var n1 = 0;
        var n2 = 0;
        var n3 = 0;
        var n4 = 0;
        var n5 = 0;
        var keys = Object.keys(clients);
        var sum = 0;
        for( var i = 0; i < keys.length; i++){// Loop over the clients
			var client = clients[keys[i]];
			vote = parseFloat(client.vote);
			sum += vote; // Sum the different votes
			if (vote <10){
				n0 += 1;
			} 
			if ((vote >=10)&&(vote <30)){
				n1 += 1;
			} 
			if ((vote >=30)&&(vote <50)){
				n2 += 1;
			} 
			if ((vote >=50)&&(vote <70)){
				n3 += 1;
			} 
			if ((vote >=70)&&(vote <90)){
				n4 += 1;
			}
			if (vote >= 90){
				n5 += 1;
			} 
			console.log("Vote");
			console.log(client.vote);
		}
		console.log("Sum"+sum);
        console.log('### message: '+message);
        mean = ((sum-50) / (keys.length-1));
        N = n;
        N0 = n0;
        N1 = n1;
        N2 = n2;
        N3 = Math.max(n3-1, 0);// To correct for display page
        N4 = n4;
        N5 = n5;
	});
    socket.on('disconnect', function () {
		delete clients[socket.id];
	});
	
	setInterval( function(){
		var t = new Date().getTime()-t0;
        socket.broadcast.emit('message', {
			't' : t,
			'mean' : mean, // Computes the mean (but correct for the display client which is not voting)
			'N' : N,
			'N0': N0,
			'N1': N1,
			'N2': N2,
			'N3': N3,
			'N4': N4,
			'N5': N5

		});
	}, 100);
	
        
});


// Service for rendering adresses
var os = require('os');
var ifaces=os.networkInterfaces();
var jsonNetWork = [];
var index = 0;
for (var dev in ifaces) {
  var alias=0;
  ifaces[dev].forEach(function(details){
    if (details.family=='IPv4') {
        jsonNetWork.push({
            id: index,
            name:dev,
            ip : details.address
        });
      console.log(dev+(alias?':'+alias:''),details.address);
      index++;
      ++alias;
    }
  });
}


function writeFile(){
    console.log('Write ip file');
    fs.writeFile('./assets/json/ips.json', JSON.stringify(jsonNetWork), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('The file was saved!');
        }
        
        console.log('Finish server loading');
    }); 
}
writeFile();
