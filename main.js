var WebSocket = require('websocket');
var WebSocketServer = WebSocket.server;
var http = require('http');

function onRequest(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
}

let server = http.createServer(onRequest);
server.listen(444, function() { });

// create the server
let wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      // process WebSocket message
        
        // Broadcast to everyone else.
        wsServer.connections.forEach(function each(client) {
          if (client !== connection && client.readyState === WebSocket.OPEN) {
            client.send(message.utf8Data);
          }
        });
    }


  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
