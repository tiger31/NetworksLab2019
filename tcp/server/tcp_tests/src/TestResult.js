

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
			return (q) ? q.reply : null;
		}
	}

	answer(id) {
		this.answers.push(id);
	}

	get ratio() {
		return this.test.questions.reduce((v, q, i) => {
			const index = q.answers.findIndex(a => a.correct);
			return (index === this.answers[i]) ? v + 1 : v;
		}, 0) / this.test.questions.length;
	}

};
