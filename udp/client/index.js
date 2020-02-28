const udp = require('dgram');
const fs = require('fs');
const packet = require('./src/classes/Dgram');
const controller = require('./src/classes/Controller');
const yargs = require('yargs').options({
	'r': {
		alias: 'read',
		describe: 'Read file from tftp server',
	},
	'w': {
		alias: 'write',
		describe: 'Writes file to tftp server',
	},
	'h': {
		alias: 'host',
		describe: 'tftp server host',
		demandOption: true
	},
	'p': {
		alias: 'port',
		describe: 'tftp server port',
		demandOption: true
	},
	'm': {
		alias: 'mode',
		default: packet.modes.octet,
		describe: 'File encoding mode',
		choices: Object.values(packet.modes)
	},
	'f': {
		alias: 'file',
		describe: 'Filename you need to read/write',
		demandOption: true
	}
}).conflicts('r', 'w').argv;

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

(async function() {
	const client = udp.createSocket('udp4');
	try {
		if (yargs.r) {
			const c = new controller(client, undefined, { port: yargs.port, host: yargs.host }, 'client');
			await c.client.read(yargs.file, yargs.mode).then((packets) => {
				writeFile(yargs.file, yargs.mode, packets);
			});
		} else {
			const data = readFile(yargs.file, yargs.mode);
			const c = new controller(client, undefined, { port: yargs.port, host: yargs.host }, 'client');
			await c.client.write(yargs.file, yargs.mode, data);
		}
	} catch (e) {
		console.log(e);
	}
	client.close();
})();
