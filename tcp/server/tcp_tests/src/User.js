const EventEmitter = require('events').EventEmitter;
const errors = require('./errors');
const Test = require('./Test');
const TestResult = require('./TestResult');

module.exports = class User extends EventEmitter {
	/**
	 * @type {string}
	 */
	username;
	/**
	 * @type {Array<TestResult>}
	 */
	_tests = [];
	/**
	 * @type {net.Socket}
	 */
	socket;
	_current;

	/**
	 * @constructor
	 */
	constructor(username) {
		super();
		this.username = username;
		this.on('tests', this.tests);
		this.on('test', this.test);
		this.on('answer', this.answer);
		this.constructor.users.push(this);
	}

	get last() {
		const last = (this._tests.length > 0) ? this._tests[this._tests.length - 1] : null;
		return (last) ? { title: last.test.title, result: last.ratio } : null;
	}

	tests = () => {
		console.log(`action=tests, ${this.username} requested tests list`);
		this.socket.write(JSON.stringify({
			action: 'tests',
			params: {
				tests: Test.reply,
				last: this.last
			}
		}));
	};

	test = (params) => {
		console.log(`action=test, ${this.username} requested test ${params.id}`);
		if (!params.id) {
			this.constructor.closeSocketWith(new errors.NotEnoughParams('test', 'id'), this.socket)
		} else {
			const test = Test.tests.find(t => t.id === params.id);
			if (!test || this._current) {
				this.constructor.closeSocketWith(new errors.CustomError('You already have one active test or test not found by id'), this.socket)
			} else {
				this._current = new TestResult(test);
				this.answer({}, false);
			}
		}
	};

	answer(params, check = true) {
		if (check)
			console.log(`action=answer, ${this.username} answered test ${params.id}`);
		if (check && !params.answer) {
			this.constructor.closeSocketWith(new errors.NotEnoughParams('answer', 'id'), this.socket)
		} else {
			if (check) {
				if (this._current.test.questions[this._current.current].answers.length > params.id) {
					this.constructor.closeSocketWith(new errors.CustomError('Answer not found by id'), this.socket);
					return;
				}
			}
			const question = this._current.question();
			let result = null;
			if (!question) {
				this._tests.push(this._current);
				this._current = null;
				result = this.last;
			}
			this.socket.write(JSON.stringify({
				action: 'answer',
				params: {
					question: question,
					result: result
				}
			}));
		}
	}

	clear() {
		console.log(`action=close, user ${this.username} disconnected`);
		this._current = null;
	}

	/**
	 * @description
	 * Attaches user to socket events
	 */
	listen() {
		console.log(`action=login, user ${this.username} connected`);
		this.socket.write(JSON.stringify({
			action: 'login'
		}));
		this.socket.on('data', (data) => {
			const json = this.constructor.parse(data, this.socket);
			if (!(json instanceof Error)) {
				this.emit(json.action, json.params);
			}
		});
		this.socket.on('close', () => {
			this.clear();
			this.socket = null;
		})
	}


	// ----- SINGLETON ----- //
	/**
	 * @description
	 * Enum of available actions for user
	 * @enum
	 * @type {Array<string>}
	 */
	static actions = ['login', 'tests', 'test', 'answer'];
	/**
	 * @description
	 * Poll of users
	 * @type {Array<User>}
	 */
	static users = [];
	/**
	 * @description
	 * Returns existed user or creates new one if
	 * @param {string} username
	 * @returns {User}
	 */
	static login = (username) => {
		const user = this.users.find(u => u.username === username);
		if (!user) {
			const newUser = new User(username);
			this.users.push(newUser);
			return newUser;
		}
		return user;
	};

	static parse = (data, socket) => {
		let json;
		try {
			json = JSON.parse(data);
			if (!json.action) {
				throw new Error();
			}
		} catch (e) {
			json = new errors.MessageNotValid(data);
			this.closeSocketWith(json, socket);
		}
		return json;
	};

	static closeSocketWith(error, socket) {
		console.log(`action=close, ${error.message}`);
		socket.write(error.response);
		socket.destroy();
	}

	/**
	 * s
	 */
	static handler = (socket) => {
		const fn = (data) => {
			const json = this.parse(data, socket);
			if (!(json instanceof Error)) {
				if (json.params && json.params.username && json.action === 'login') {
					const user = this.login(json.params.username);
					if (user.socket) {
						this.closeSocketWith((new errors.SessionAlreadyExists(user)), socket);
					} else {
						user.socket = socket;
						user.listen();
						socket.off('data', fn);
					}
				} else {
					this.closeSocketWith((new errors.IllegalState(json.action)), socket);
				}
			}
		};
		socket.on('data', fn);
	};
};