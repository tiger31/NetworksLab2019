const split = require('buffer-split');
const types = {
	read: 0x0001,
	write: 0x0002,
	data: 0x0003,
	ack: 0x0004,
	error: 0x0005
};

const modes = {
	netascii: 'netascii',
	octet: 'octet'
};

module.exports = class Dgram {
	_type;
	_filename;
	_mode;
	_number;
	_data;
	constructor({type, filename, mode, number, data} = {}) {
		this._type = type;
		this._filename = filename;
		this._mode = mode;
		this._number = number;
		this._data = data;
	};
	type(value) {
		this._type = value;
		return this;
	}
	filename(value) {
		this._filename = value;
		return this;
	}
	mode(value) {
		this._mode = value;
		return this;
	}
	number(value) {
		this._number = value;
		return this;
	}
	data(value) {
		this._data = value;
		return this;
	}

	build() {
		let data = Buffer.alloc(514, 0x0);
		let offset = 0;
		data.writeUInt16BE(this._type, offset); offset += 2;
		switch (this._type) {
			case types.read:
			case types.write:
				data.write(this._filename, offset, 'ascii'); offset += this._filename.length;
				data.writeUInt8(0x00, offset); offset++;
				data.write(this._mode, offset, 'ascii'); offset += this._mode.length;
				data.writeUInt8(0x00, offset); offset++;
				break;
			case types.data:
				data.writeUInt16BE(this._number, offset); offset += 2;
				data = Buffer.concat([data.subarray(0, 4), this._data], offset = offset + this._data.length);
				break;
			case types.ack:
				data.writeUInt16BE(this._number, offset); offset += 2;
				break;
			case types.error:
				break;
		}
		return data.slice(0, offset);
	}

	static parse(buffer) {
		const packet = new Dgram();
		let offset = 0;
		packet._type = buffer.readUInt16BE(offset); offset += 2;
		switch(packet._type) {
			case types.read:
			case types.write:
				const [filename, mode] = split(buffer.subarray(2, buffer.length), Buffer.from('\u0000'));
				packet._filename = filename;
				packet._mode = mode;
				break;
			case types.data:
				packet._number = buffer.readUInt16BE(offset); offset += 2;
				packet._data = buffer.subarray(offset, buffer.length);
				break;
			case types.ack:
				packet._number = buffer.readUInt16BE(offset); offset += 2;
				break;
			case types.error:
				break;
		}
		return packet;
	}
};
module.exports.types = types;
module.exports.modes = modes;