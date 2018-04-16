// ==UserScript==
// @name        MegaBytes Slither.io helper
// @version     0.0.5
// @namespace
// @updateURL
// @downloadURL
// @icon
// @homepageURL
// @author      MegaByte
// @description Play with friends in Slither.io
// @require     https://code.jquery.com/jquery-git.min.js
// @match        http://slither.io
// ==/UserScript==

// Note: You will have to run your own node.js server obviously, I'm using this on lan.
var MY_WEBSOCKET = "ws://192.168.1.10:444/echo";

var SEND_UPDATE_MS = 250;
var RECV_UPDATES_TTL = 5000*100;

// Auto connect allows you to play on same server as a friend.
var autoConnect = true;
var AUTO_CONNECT_MS = 1000;
var autoConnect_ip = '139.99.130.166';
var autoConnect_port = 444;


var render_grid = false;


(function() {
    'use strict';

    function connectTo(ip, port) {
        var splits = ip.split(':');
        if (splits.length > 1) {
            ip = splits[0]; port = splits[1];
        }
        bso = {ip: ip, po: port};
        forcing =true;
        connect();
    }

    $(document).ready(function() {
        var $locationBox = $( '<div id="locationBox" style="position:fixed;left: 120px; top: 3px; color: lightgray; z-index:99999999; width: 500px">Location: <span id="snakeLocation"></div>' );
        $( "body" ).append( $locationBox );
        var $snakeLocation = $('#snakeLocation');


        var overlayWidth = 2000;
        var overlayHeight = 2000;

        var $overlayBox = $( '<div id="overlayBox" style="position:fixed;left: 0px; top: 0px; z-index:9999; pointer-events: none; opacity: 0.6"><canvas id="overlayCanvas" width="'+overlayWidth+'" height="'+overlayHeight+'"></canvas></div>' );
        $( "body" ).append( $overlayBox );

        var overlayCanvas = document.getElementById('overlayCanvas');
        var overlayCtx = overlayCanvas.getContext('2d');

        var xCoords = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        var yCoords = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

        var xCoordsLen = xCoords.length;
        var yCoordsLen = yCoords.length;
        var gameWidth = 43000;
        var gameHeight = 43000;

        var scale = 0.5;
        var scaleWidth =  overlayWidth / gameWidth;
        var scaleHeight = overlayHeight / gameHeight;

        var xIndexSize = gameWidth / xCoords.length;
        var yIndexSize = gameHeight / yCoords.length;

        var gameSectorWidth = gameWidth / xCoordsLen;
        var gameSectorHeight = gameHeight / yCoordsLen;

        function getCoordinate(x,y) {
            var xIndex = Math.floor(x / xIndexSize);
            var yIndex = Math.floor(y / yIndexSize);
            return xCoords[xIndex] + yCoords[yIndex];
        }

        function updatePosition() {
            if (snake !== null) {
                $snakeLocation.text(getCoordinate(snake.xx, snake.yy) + ' ' + snake.xx.toFixed(3) + ' , ' + snake.yy.toFixed(3) + ' ' + snake.sp.toFixed(3));

                // Send to server.
                if(connection && connection.readyState === WebSocket.OPEN){
                    connection.send(JSON.stringify({id: snake.id, xx: snake.xx, yy: snake.yy, msl: snake.msl, nk: snake.nk, cs: snake.cs, pts: snake.pts, sc: snake.sc, wmd: snake.wmd }));

                    // TODO: Send food and snakes?
                } else if (connection.readyState === WebSocket.CLOSED) {
                    wsServerConnect();
                }
            }
        }

        setInterval(updatePosition, SEND_UPDATE_MS);

        if (autoConnect) {
            setTimeout(function(){
                // Connect to low latency server for me.
                connectTo(autoConnect_ip, autoConnect_port);
            }, AUTO_CONNECT_MS);
        }

        function fadeCanvas() {
            overlayCtx.save();
            overlayCtx.globalAlpha = 0.2;
            overlayCtx.globalCompositeOperation='destination-out';
            overlayCtx.fillStyle= '#000000';
            overlayCtx.fillRect(0,0,overlayCanvas.width, overlayCanvas.height);
            overlayCtx.restore();
        }

        function renderOverlay(delta) {
            fadeCanvas();

            if (!snake) {
                return;
            }

            overlayCtx.strokeStyle = 'rgba(255,255,255,0.25)';
            overlayCtx.lineWidth = 1;

            if (render_grid) {
                var p = 0;
                var d = 0;
                for (var i = 0; i<gameWidth; i=i+gameSectorWidth) {
                    var x = i * scaleWidth * scale;

                    d = 0;
                    for (var j = 0; j<gameHeight; j=j+gameSectorHeight) {
                        var u = j * scaleHeight * scale;


                        if (j === 0) {
                            overlayCtx.moveTo(x,0);
                            overlayCtx.lineTo(x,gameHeight*scale);
                            overlayCtx.stroke();
                        }

                        overlayCtx.moveTo(0,u);
                        overlayCtx.lineTo(gameWidth*scale,u);
                        overlayCtx.stroke();

                        overlayCtx.fillStyle = '#FFFFFF';
                        overlayCtx.font = "10px Arial";
                        overlayCtx.fillText(xCoords[p]+yCoords[d],x + 3, u - 3);

                        d++;
                    }

                    p++;
                }

                ctx.lineWidth = 1;
            }


            for (var i=0; i<foods.length; i++) {

                var food = foods[i];
                if (!food) {
                    continue;
                }

                overlayCtx.strokeStyle = 'rgba(255,0,0,0.01)';
                overlayCtx.fillStyle = 'rgba(255,0,0,0.01)';

                overlayCtx.beginPath();
                overlayCtx.arc(food.xx * scaleWidth * scale, food.yy * scaleHeight * scale, food.rad, 0, 2 * Math.PI);
                overlayCtx.stroke();
                overlayCtx.fill();
                overlayCtx.closePath();
            }

            for (var i=0; i<preys.length; i++) {

                var prey = preys[i];
                if (!prey) {
                    continue;
                }

                overlayCtx.strokeStyle = prey.cs;
                overlayCtx.fillStyle = prey.cs;

                overlayCtx.beginPath();
                overlayCtx.arc(prey.xx * scaleWidth * scale, prey.yy * scaleHeight * scale, prey.rad, 0, 2 * Math.PI);
                overlayCtx.stroke();
                overlayCtx.fill();
                overlayCtx.closePath();
            }

            for (var i=0; i<snakes.length; i++) {

                var _snake = snakes[i];
                if (!_snake) {
                    continue;
                }

                overlayCtx.strokeStyle = _snake.cs;
                overlayCtx.fillStyle = _snake.cs;


                // Skip drawing self?
                if (_snake.id === snake.id) {
                    overlayCtx.lineWidth = 1.25;
                    overlayCtx.strokeStyle = '#FF00FF';
                }

                if (_snake.wmd) {
                    overlayCtx.lineWidth = 1.25;
                    overlayCtx.strokeStyle = '#FFFF33';
                }

                var snakeRadius = _snake.sc;

                for (var b = 0; b<_snake.pts.length; b++) {
                    var pt = _snake.pts[b];
                    overlayCtx.beginPath();
                    overlayCtx.arc(pt.xx * scaleWidth * scale, pt.yy * scaleHeight * scale, snakeRadius, 0, 2 * Math.PI);
                    overlayCtx.stroke();
                    overlayCtx.fill();
                    overlayCtx.closePath();
                }

                overlayCtx.beginPath();
                overlayCtx.arc(_snake.xx * scaleWidth * scale, _snake.yy * scaleHeight * scale, snakeRadius, 0, 2 * Math.PI);
                overlayCtx.stroke();
                overlayCtx.fill();
                overlayCtx.closePath();

                overlayCtx.lineWidth = 1;
            }

            Object.keys(renderInfos).forEach(function (key) {
                var message = renderInfos[key];

                message.ttl += delta;
                if (message.ttl >= RECV_UPDATES_TTL) {
                    delete renderInfos[key];
                    return;
                }

                overlayCtx.lineWidth = 1;

                overlayCtx.strokeStyle = '#FF00FF';
                overlayCtx.fillStyle = message.cs;

                // Skip drawing self.
                if (message.id === snake.id) {
                  return;
                }

                if (message.wmd) {
                    overlayCtx.lineWidth = 1.5;
                    overlayCtx.strokeStyle = '#FFFF33';
                }

                var snakeRadius = message.sc || 2;

                if (message.pts) {
                    for (var b = 0; b<message.pts.length; b++) {
                        var pt = message.pts[b];
                        overlayCtx.beginPath();
                        overlayCtx.arc(pt.xx * scaleWidth * scale, pt.yy * scaleHeight * scale, snakeRadius, 0, 2 * Math.PI);
                        overlayCtx.stroke();
                        overlayCtx.fill();
                        overlayCtx.closePath();
                    }
                }

                overlayCtx.beginPath();
                overlayCtx.arc(message.xx * scaleWidth * scale, message.yy * scaleHeight * scale, snakeRadius, 0, 2 * Math.PI);
                overlayCtx.stroke();
                overlayCtx.fill();
                overlayCtx.closePath();
            });

            overlayCtx.lineWidth = 1;


        }

        var renderInfos = {};

        var start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            var delta = timestamp - start;
            renderOverlay(delta);
            window.requestAnimationFrame(step);
        }

        $('body').bind('mousewheel', function(e){
            if(e.originalEvent.wheelDelta /120 > 0) {
                scale -= 0.125;
                if (scale < 0.125) {
                    scale = 0.125;
                }
            }
            else{
                console.log('scrolling down !');
                scale += 0.125;
            }
        });

        window.requestAnimationFrame(step);


        var connection;
        function wsServerConnect() {
            connection = new WebSocket(MY_WEBSOCKET);

            // When the connection is open, send some data to the server
            connection.onopen = function () {
                //connection.send('Ping'); // Send the message 'Ping' to the server
            };

            // Log errors
            connection.onerror = function (error) {
                console.log('WebSocket Error ' + error);
            };

            // Log messages from the server
            connection.onmessage = function (e) {
                try {
                    var message = JSON.parse(e.data);
                    message.ttl = 0;
                    renderInfos[message.id] = message;

                    //var networkSnakes = message.snakes;
                    //Object.keys(networkSnakes).forEach(function (key) {
                    //   var s = networkSnakes[key];

                        //if (!snakes[key]) {
//                            snakes[key] = s;
//                        }
//                    });

//                    var networkFoods = message.foods;

//                    for (var i=0; i<networkFoods.length; i++) {
//                        if (!f) {
//                            continue;
//                        }
//                        var f = networkFoods[i];
//                        var found = false;
//                        for (var j=0; j<foods.length; j++) {
//                            if (foods[j].id == f.id) {
//                                found = true;
//                            }
//                        }
//                        if (found === false) {
//                            foods.push(f);
//                        }
//                    }



                }
                catch (ex) {
                    console.error("Error parsing message:", ex.data, ex);
                }
            };
        }

        wsServerConnect();


    });

})();


