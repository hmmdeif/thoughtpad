module.exports = {
	modules: {
		development: [ 'compiler-coffeekup' ],
		production: [ 'bundler' ],
        test: []
	},
	cssbundle: {
        one: ['a', 'b'],
        two: ['c', 'd', 'e']
    },
    layouts: {
        'foo': {
            url: 'foo.html',
            layouts: {
                'bar': {
                    url: 'bar.html'
                }
            }
        },
        'too': {
            url: 'too.html'
        }
    },
    topPages: ['home'],
    pages: {
        home: {
            url: 'home.html',
            pages: [
                'one',
                'two'
            ],
            sortBy: 'number'
        },
        one: {
            number: 1,
            url: 'one.html'
        },
        two: {
            number: 3,
            url: 'two.html',
            layout: 'bar',
            index: true
        }
    }
}