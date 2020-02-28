const udp = require('dgram');
const fs = require('fs');
const packet = require('./src/classes/Dgram');
const controller = require('./src/classes/Controller');

const FILES_ROOT = 'home';

const readFile = (filename, mode = packet.modes.netascii) => {
	const data = fs.readFileSync(`${FILES_ROOT}/${filename}`);
	const arr = [];
	for (let i = 0; i < Math.round(data.length / 512); i++) {
		arr.push(data.subarray(i * 512, (i  + 1) * 512));
	}
	return [
		...(arr.length ? arr : [data]).map((d, i) => new packet({
			type: packet.types.data,
			mode,
			data: d,
			number: i + 1,
		}))
	];
};

writeFile = (filename, mode, packets) => {
	const data = fs.writeFileSync(`${FILES_ROOT}/${filename}`, packets.reduce((b, p) => {
		return Buffer.concat([b, p._data]);
	}, Buffer.alloc(0)))
};

const server = udp.createSocket('udp4');
server.on('listening', () => {});
server.on('connect', (...args) => {
	console.log(args);
});
server.on('message', (msg, rinfo) => {
	const p = packet.parse(msg);
	switch (p._type) {
		case packet.types.write:
			console.log('WRQ');
			const client = udp.createSocket('udp4');
			const c = new controller(client, server, rinfo);
			c.server.write().then((packets) => {
				writeFile(p._filename, p._mode, packets);
				client.close();
			});
			break;
		case packet.types.read:
			console.log('RRQ');
			const rclient = udp.createSocket('udp4');
			const rc = new controller(rclient, server, rinfo);
			const packets = readFile(p._filename, p._mode);
			rc.server.read(packets).then(() => {
				rclient.close();
			});
			break;
		case packet.types.ack:
			console.log('ACK', p._number);
			server.emit('ack', p, rinfo);
			break;
		case packet.types.data:
			console.log('DATA');
			server.emit('data', p, rinfo);
			break;
		default:
			console.log(p);
	}
});
server.on('error', (err) => {
	console.log(err);
});
server.bind(3000);

