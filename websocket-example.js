//Definitive Guide to HTML5 WebSocket
// Ejemplo WebSocket server

//See the WebSocket Protocol for the official specification
// http://tools.ietf.org/html/rfc6455

var events = require("events");
var http = require("http");
var crypto = require("crypto");
var util = require("util");

//opcodes for WebSocket frames
// http://tools/ietf.org/html/rfc6455#section-5.2

var opcodes = { TEXT : 1
	, BINARY: 2
	, CLOSE: 8
	, PING: 9
	, PONG: 10
	};
	
var WebSocketConnection = function(req, socket, upgradeHead){
	var self = this;
	
	var key = hashWebSocketKey(req.headers["sec-websocket-key"]);

//Handshake response
//http://tools.ietf.org/html/rfc6455#section-4.2.2

socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
	'Upgrade: WebSocket\r\n' +
	'Connection: Upgrade\r\n' +
	'sec-websocket-accept: ' + key +
	'r\n\r\n');

socket.on("data", function(buf){
	self.buffer = Buffer.concat([self.buffer, buf]);
	while(self._processBuffer()){
		//Process buffer while it contains complete frames
		}
	});

socket.on("data", function(had_error){
	if(!self.closed){
		slef.emit("close", 1006);
		self.closed = true;
	}
});

// Initialize connection state

this.socket = socket;
this.buffer = new Buffer(0);
this.closed = false;

}

util.inherits(WebSocketConnection, events.EventEmitter);

//Send a text or binary message on the WebSocket connection

WebSocketConnection.prototype.send = function(obj){
	var opcode;
	var payload;
	if (Buffer.isBuffer(obj)){
		opcode = opcodes.BINARY;
		payload = obj;
	} else if (typeof obj == "string"){
	opcode = opcodes.TEXT;
// Create a new buffer containing the UTF-8 encoded string
	payload = new Buffer(obj, "utf-8");
	} else {
	throw new Error("Cannot send object. Must be string or Buffer");
	}
	this._doSend(opcode, payload);
}

// Close the WebSocket Connection

WebSocketConnection.prototype.close = function(code, reason) {
	var opcode = opcodes.CLOSE;
	var buffer;
	
// Encode close and reason

if(code){
	buffer = new Buffer(Buffer.byteLength(reason) + 2);
	buffer.writeUInt16BE(code, 0 );
	buffer.write(reason, 2);
	} else{
		buffer = new Buffer(0):
	}
		this._doSend(opcode, buffer);
		this.closed = true;
}

// Process incoming bytes

WebSocketConnection.prototype._processBuffer = function(){
	var buf = this.buffer;
	
	if(buf.lenght < 2){
		//Insufficient data read
		return;
	}

	var idx = 2;
	
	var b1 = buf.readUInt8(0);
	var fin = b1 & 0x80;
	var opcode = b1 & 0x0f; // low 4 bits
	var b2 = buf.readUInt8(1);
	var mask = b2 & 0x80;
	var length = b2 & 0x7f; // low 7 bits
	
	if(length > 125){
		if(buf.length < 8){
		//insufficient data read
		return;
		}
	if(length == 126){
	length = buf.readUInt16BE(2);
	idx += 2;
	} else if(length == 127){
	//Discard high 4 bits because this server cannot handle huge lengths
	var highBits = buf.readUInt32BE(2);
	if(highBits !=0){
	this.close(1009,"");
	}
	length = buf.readUInt32BE(6);
	idx += 8;
	}
}

if(buf.lenght < idx + 4 + lenght{
	//insufficient data read
	return;
}

masBytes = buf.slice(idx, idx+4);
idx += 4;
var payload = buf.slice(idx, idx+length);
payload = unmask(maskBytes, payload);
this._handleFrame(opcode, payload);

this.buffer = buf.slice(idx+length);
return true;
}

WebSocketConnection.prototype._handleFrame = function(opcode, buffer){
var payload;
switch (opcode){
	case opcodes.TEXT:
	payload = buffer.toString("utf8");
	this.emit("data", opcode, payload);
	break;
	case opcodes.BINARY:
	payload = buffer;
	this.emit("data", opcode, payload);
	break;
	case opcodes.PING:
	//Respong to pongs with pongs
	this._doSend(opcodes.PONG, buffer);
	break;
	case opcodes.PONG:
	//Ignore PONGS
	break;
	case opcodes.CLOSE:
	//Parse close and reason
	var code, reason;
	if(buffer.length >=2){
	code = buffer.readUInt16BE(0);
	reason = buffer.toString("utf8"), 2);
	}
	
	this.close(code, reason);
	this.emit("close", code, reason);
	break;
	default;
	this.close(1002, "unknown opcode");
	}
}

//Format and send a WebSocket message

WebSocketConnection.prototype._doSend = function(opcode, payload){
	this.socket.write(endcodeMessage(opcode, payload));
	}
	
	var KEY_SUFFIX = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	var hashWebSocketKey = function(key){
		var sha1 = crypto.createHash("sha1");
		sha1.update(key+KEY_SUFFIX, "ascii");
		return sha1.digest("base64");
	}
	
	var unmask = function(maskBytes, data){
		var payload = new Buffer(data.length);
		for(var i=0; i<data.length; i++){
			payload[i] = maskBytes[i%4] ^ data[i];
			}
			return payload;
		}
		
	var encodeMessage = function(opcode, payload){
	var buf;
	//First byte: find and opcode
	var b1 = 0x80 | opcode;
	//always send message as one frame(fin)

// Second byte: mask and length part 1
//Followed by 0, 2, or 8 additional bytes of continued length

var b2 = 0; //Server does not mask frames
var length = payload.length;
if(lenght<126){
	buf = new Buffer(payload.length + 2 + 0);
	//Zero extra bytes
	b2 |= length;
	buf.writeUInt8(b1, 0);
	buf.writeUInt8(b2, 1);
	payload.copy(buf, 2);
} else if (length <(1<<16)){
	buf = new Buffer(payload.length + 2 + 2);
	//Two bytes extra
	b2 |= 126;
	buf.writeUInt8(b1,0);
	buf.writeUInt8(b2, 1);
	//Add two byte lenght
	buf.writeUint16BE(length, 2);
	payload.copy(buf, 4);
} else {
	buf = new Buffer(payload.length + 2 + 8);
	//Eight bytes extra
	b2 |= 127;
	buf.writeUInt8(b1, 0);
	buf.writeUInt8(b2, 1);
	//Add Eight byte length
	//Note: This implementation cannot handle lengths greater than 2^32
	//The 32 bit length is prefixed with 0x0000
	buf.writeUInt32BE(0, 2);
	buf.writeUInt32BE(length, 6);
	payload.copy(buf, 10);
	}
return buf;
}

exports.listen = function(port, host, connectionHandler){
	var srv = http.createServer(function(req, res){
	});
	
	srv.on('upgrade', function(req, socket, upgradeHead){
		var ws = new WebSocketConnection(req, socket, upgradeHead);
		connectionHandler(ws);
	});
	
srv.listen(port, host);
};