const uuid = require('uuid/v4');
const Question = require('./Question');

module.exports = class Test {
	/**
	 * @type {string}
	 */
	title;
	id;
	/**
	 *
	 */
	constructor(title, questions) {
		this.id = uuid();
		this.title = title;
		this.questions = questions.map(q => new Question(q));
		this.constructor.tests.push(this);
	}

	// ----- SINGLETON ----- //
	/**
	 * @description
	 * Contains all created tests
	 * @type {Array<Test>}
	 */
	static tests = [];
	static get reply() {
		return this.tests.map(t => ({id: t.id, title: t.title}));
	}
};