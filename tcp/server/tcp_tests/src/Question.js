const Answer = require('./Answer');

module.exports = class Question {
	title;
	answers;
	constructor({title, answers} = {}) {
		this.title = title;
		this.answers = answers.map((a, i) => new Answer({title: a.title, id: i, correct: a.correct}));
	}

	get reply() {
		return {
			title: this.title,
			answers: this.answers.map(a => a.reply)
		}
	}
};