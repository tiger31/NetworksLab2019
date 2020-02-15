const Test = require('./Test');
module.exports = () => {
	new Test('Math test', [
		{ title: 'What is 2+2:', answers:
			[
				{ title: '5' },
				{ title: '3' },
				{ title: '22' },
				{ title: '4', correct: true },
			]
		},
		{ title: 'What is 2-2:', answers:
				[
					{ title: '0', correct: true },
					{ title: '2' },
					{ title: 'null' },
					{ title: '4'},
				]
		},
		{ title: 'What is 2 + -2:', answers:
				[
					{ title: '0', correct: true },
					{ title: '2-2' },
					{ title: 'Infinity' },
					{ title: 'NaN'},
				]
		}
	]);
	new Test('Programming test', [
		{ title: 'const a = b = 7, What\'s "a" value:', answers:
				[
					{ title: 'undefined' },
					{ title: '7', correct: true },
					{ title: 'Error' },
					{ title: 'b'},
				]
		},
		{ title: 'What\'s output of: typeof (new Error()) === \'error\'', answers:
				[
					{ title: 'true' },
					{ title: 'false', correct: true },
				]
		}
	])
};