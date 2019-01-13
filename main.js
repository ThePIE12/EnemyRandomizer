'use strict'
// Loading modules
const fs = require('fs')
const readlineSync = require('readline-sync')
const mkdirp = require('mkdirp')
const path = require('path')
const shuffleSeed = require('shuffle-seed')
const ncp = require('ncp').ncp
const {
	performance
} = require('perf_hooks')

// Pauses process
function Sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// Found this here: https://stackoverflow.com/a/31831122/10897513
function directoryTreeToObj(dir, done) {
	var results = []

	fs.readdir(dir, function (err, list) {
		if (err)
			return done(err)

		var pending = list.length

		if (!pending)
			return done(null, {
				name: path.basename(dir),
				type: 'folder',
				children: results
			})

		list.forEach(function (file) {
			file = path.resolve(dir, file)
			fs.stat(file, function (err, stat) {
				if (stat && stat.isDirectory()) {
					directoryTreeToObj(file, function (err, res) {
						results.push({
							name: path.basename(file),
							type: 'folder',
							children: res
						})
						if (!--pending)
							done(null, results)
					})
				} else {
					results.push({
						type: 'file',
						name: path.basename(file)
					})
					if (!--pending)
						done(null, results)
				}
			})
		})
	})
}

// The actual thing that does stuff
function main(Options) {
	let t0 = performance.now()
	let inputDir = 'input'
	let dir = 'output/Randomized-enemies/assets/data/enemies/'

	if (!fs.existsSync(dir))
		mkdirp(dir, function (err) {
	  	if (err)
				console.error(err)

			if (!fs.existsSync('output/Randomized-enemies/package.json'))
				fs.writeFileSync('output/Randomized-enemies/package.json', JSON.stringify({'name': 'Randomized enemies'}), 'utf8')

			ncp(inputDir, dir, function (err) {
				if (err) return console.error(err)
				main1_5()
			})
		})
	else
		main1_5()

	function main1_5() {
		directoryTreeToObj(dir, function (err, res) {
			if (err)
				console.error(err)

			console.log(`\n>> Sucessfully read directory '${dir}'`)
			main2(res)
		})
	}

	function main2(res) {

		function IterateTree(arr, _path, result) {
			arr.forEach(function(treeObj) {
				if (treeObj.type === 'folder') {
					IterateTree(treeObj.children, path.join(_path, treeObj.name), result)
				} else {
					result.push({
						[treeObj.name]: JSON.parse(fs.readFileSync(path.join(_path, treeObj.name), 'utf8'))
					})
				}
			})

			return result
		}

		let enemyObjects = IterateTree(res, dir, [])
		var keys = []
		enemyObjects.forEach(function(item) {
			keys.push(Object.keys(item)[0])

			item[keys[keys.length-1]].Randomiser = item[keys[keys.length-1]].Randomiser || {}
			item[keys[keys.length-1]].Randomiser.origName = item[keys[keys.length-1]].Randomiser.origName || keys[keys.length-1]
		})

		let indexes = []
		for (let i = 0; i < keys.length; i++) {
			indexes.push(i)
		}

		if (Options.seed === '') {
			Options.seed = Math.random().toString().slice(2,11)
		}
		let shuffledKeys = shuffleSeed.shuffle(indexes, Options.seed)

		let temp
		for (let i = 0; i < enemyObjects.length; i++) {
			temp = enemyObjects[i][keys[i]]
			enemyObjects[i][keys[i]] = enemyObjects[shuffledKeys[i]][keys[shuffledKeys[i]]]
			enemyObjects[shuffledKeys[i]][keys[shuffledKeys[i]]] = temp
		}

		let restore = Options.restore
		function main3(tree, _path) {
			tree.forEach(function(treeObj) {
				if (treeObj.type === 'folder') {
					main3(treeObj.children, path.join(_path, treeObj.name))
				} else {
					for (let i = 0; i < enemyObjects.length; i++) {
						if (keys[i] === treeObj.name && !restore) {
							console.log('Ramdomized: ' + treeObj.name)
							fs.writeFile(path.join(_path, treeObj.name), JSON.stringify(enemyObjects[i][keys[i]]), 'utf8', function(err) {
								if(err)
									console.error(err)
							})
							break
						} else if (restore) {
								if ((enemyObjects[i][keys[i]].Randomiser) && (enemyObjects[i][keys[i]].Randomiser.origName === treeObj.name)) {
									console.log('Restored: '+ treeObj.name)
									delete enemyObjects[i][keys[i]].Randomiser
									fs.writeFile(path.join(_path, treeObj.name), JSON.stringify(enemyObjects[i][keys[i]]), 'utf8', function(err) {
										if(err)
											console.error(err)
									})
									break
							}
						}
					}
				}
			})
		}

		keys = []
		enemyObjects.forEach(function(item) {
			keys.push(Object.keys(item)[0])
		})

		main3(res, dir)

		let t1 = performance.now()
		console.log('\nTook ' + (t1 - t0) + ' milliseconds.\n')
		if (!restore)
			console.log(`Seed: ${Options.seed}`)
	}
}

if (!fs.existsSync('input/arid')) {
	console.log('Copy the contents of \'CrossCode/assets/data/enemies/\' into the \'input\' folder!')
	process.exit(1)
}

let Options = {}

Options.restore = readlineSync.question(
	'\nRestore? (Y)es or (N)o?' +
	'\nDefault is: N\n>>  ').toLowerCase() == 'y' ? true : false

if (!Options.restore)
	Options.seed = readlineSync.question('\nSeed? Empty for a random seed.\n>>  ')
else
	Options.seed = ''

main(Options)
