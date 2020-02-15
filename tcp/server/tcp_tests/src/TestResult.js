

module.exports = class TestResult {
	test;
	answers = [];
	current = 0;

	constructor(test) {
		this.test = test;
	};

	question() {
		if (this.current > this.test.questions.length)
			return null;
		else {
			const q = this.test.questions[this.current++];
			return q.reply;
		}
	}

	answer(id) {
		this.answers.push(id);
	}

	get ratio() {
		return this.test.questions.reduce((v, q, i) => {
			if (q.answers.findIndex(a => a.correct) === this.answers[i])
				v++;
		}, 0)
	}

};