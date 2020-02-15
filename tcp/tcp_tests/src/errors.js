

module.exports.SessionAlreadyExists = class SessionAlreadyExists extends Error {
	constructor(user) {
		super();
		this.message = `Session for user ${user.username} already exists`;
		this.response = JSON.stringify({
			action: 'close',
			message: this.message
		})
	}
};

module.exports.MessageNotValid = class MessageNotValid extends Error {
	constructor(data) {
		super();
		this.message = `Message ${data} has invalid structure`;
		this.response = JSON.stringify({
			action: 'close',
			message: this.message
		})
	}
};

module.exports.IllegalState = class IllegalState extends Error {
	constructor(data) {
		super();
		this.message = `Action ${data} not supported or can't be used now`;
		this.response = JSON.stringify({
			action: 'close',
			message: this.message
		})
	}
};

module.exports.NotEnoughParams = class NotEnoughParams extends Error {
	constructor(action, ...params) {
		super();
		this.message = `Action ${action} requires params: ${params.join(', ')}`
		this.response = JSON.stringify({
			action: 'close',
			message: this.message
		})
	}
};

module.exports.CustomError = class CustomError extends Error {
	constructor(message) {
		super();
		this.message = message;
		this.response = JSON.stringify({
			action: 'close',
			message: this.message
		})
	}
};
