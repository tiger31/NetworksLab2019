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
			this._server = server;
			this.__ack = (packet, rinfo) => {
				//TODO check rinfo
				if(packet._number === this._ack.number)
					this._ack.rs();
			};
			this._server.on('ack', this.__ack);
			this.__data = (packet, rinfo) => {
				//TODO check rinfo
				if(packet._number === this._data.number)
					this._data.rs(packet);
				if(packet._number < this._data.number)
					this.accept(packet._number);
			};
			this._server.on('data', this.__data);
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
		return new Promise((rs, rj) => {
			this.socket.send(new Packet({ type: Packet.types.ack, number }).build(), this.info.port, this.info.address, rs);
		})
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
						await this.accept(next - 1);
						console.log('Accept', next - 1);
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
			await this.accept(next - 1);
			console.log('Accept', next - 1);
			this._server.off('ack', this.__ack);
			this._server.off('data', this.__data);
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
					console.log(p._number);
					const ack = this.ack(p._number);
					this.socket.send(p.build(), this.info.port, this.info.server, (err) => {
						if (err) {
							this.socket.close();
							rj(err);
						}
					});
					try {
						await ack;
						console.log('ACK accepted');
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
			this._server.off('ack', this.__ack);
			this._server.off('data', this.__data);
			rs();
		});
	}

	server = {
		write: () => {
			return this.receive();
		},
		read: (packets) => {
			return this.transfer(packets);
		}
	}

};