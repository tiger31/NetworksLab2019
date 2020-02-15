
module.exports = class Answer {
	title;
	correct;
	constructor({title, id, correct = false} = {}) {
		this.title = title;
		this.id = id;
		this.correct = correct;
	}

	get reply() {
		return {
			id: this.id,
			title: this.title
		}
	}
};