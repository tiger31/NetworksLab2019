const Packet = require('./Dgram');

module.exports = class Controller {
	socket;
	info;
	_ack;
	_data;
	constructor(socket, server, info, mode = 'server') {
		this.socket = socket;
		this.info = info;
		if (mode === 'server') {
			server.on('ack', (packet, rinfo) => {
				//TODO check rinfo
				if(packet._number === this._ack.number)
					this._ack.rs();
			});
			server.on('data', (packet, rinfo) => {
				//TODO check rinfo
				if(packet._number === this._data.number)
					this._data.rs(packet);
				if(packet._number < this._data.number)
					this.accept(packet._number);
			})
		}
	}

	ack(number) {
		return new Promise((rs,  rj) => {
			const timer = setTimeout(() => {
				rj(`ACK ${number}, wasn't received in 3s delay`)
			},3000);
			this._ack = {
				rs: () => {
					clearTimeout(timer);
					rs();
				},
				rj, number
			};
		});
	};

	data(number) {
		return new Promise((rs, rj) => {
			const timer = setTimeout(() => {
				rj(`DATA ${number}, wasn't received in 3s delay`)
			},3000);
			this._data = {
				rs: (packet) => {
					clearTimeout(timer);
					rs(packet);
				},
				rj, number
			}
		});
	}

	accept(number) {
		this.socket.send(new Packet({ type: Packet.types.ack, number }).build(), this.info.port, this.info.address);
	}

	receive() {
		return new Promise(async (rs, rj) => {
			const data = [];
			let next = 1;
			let packet;
			do {
				let received = false;
				let retry = 0;
				for (retry = 0; retry < 3; retry++) {
					try {
						this.accept(next);
						const p = await this.data(next);
						next++;
						packet = p;
						data.push(p);
						received = true;
						break;
					}	catch (e) {
						console.log(e);
					}
				}
				if (retry === 3 && !received) {
					rj('Reached max retries (3), closing session');
					break;
				}
			} while(packet && packet._data.length === 512);
			this.accept(next);
			rs(data);
		});
	}

	transfer(packets) {
		const queue = packets;
		return new Promise(async (rs, rj) => {
			let p = queue.shift();
			while (p) {
				let sent = false;
				let retry = 0;
				for (retry = 0; retry < 3; retry++) {
					const ack = this.ack(p._number);
					this.socket.send(p.build(), this.info.port, this.info.server, (err) => {
						if (err) {
							this.socket.close();
							rj(err);
						}
					});
					try {
						await ack;
						sent = true;
						p = queue.shift();
						break;
					} catch (e) {
						console.log(e);
					}
				}
				if (retry === 3 && !sent) {
					rj('Reached max retries (3), closing session');
					break;
				}
			}
			rs();
		});
	}

	client = {
		write: (file, mode, data) => {
			this.socket.on('message', (buffer) => {
				const packet = Packet.parse(buffer);
				if (packet._number === this._ack.number) {
					this._ack.rs();
				}
			});
			const p = new Packet({filename: file, type: Packet.types.write, mode, number: 0});
			return this.transfer([p, ...data]);
		},
		read: (file, mode) => {
			this.socket.on('message', (buffer, rinfo) => {
				const packet = Packet.parse(buffer);
				if (packet._number === this._data.number)
					this._data.rs(packet);
				if (packet._number < this._data.number)
					this.accept(packet._number);
			});
			const p = new Packet({filename: file, type: Packet.types.read, mode, number: 0});
			this.socket.send(p.build(), this.info.port, this.info.address);
			return this.receive();
		}
	};

	server = {
		write: () => {
			return this.receive();
		},
		read: (packets) => {
			return this.transfer(packets);
		}
	}

};
