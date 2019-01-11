'use strict'
// Loading modules
const fs = require('fs')
const readline = require('readline-sync')
const path = require('path')
const shuffleSeed = require('shuffle-seed')
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
function main() {
	let baseDir = 'C:/Program Files (x86)/Steam/steamapps/common/CrossCode'
	let dir = path.join(baseDir, 'assets/data/enemies')

	directoryTreeToObj(dir, function (err, res) {
		if (err)
			console.error(err)

		console.log(`\n>> Sucessfully read directory '${dir}'`)
		main2(res)
	})

	function main2(res) {
		function IterateTree(arr, _path) {
			var result = []
			arr.forEach(function(treeObj) {
				if (treeObj.type === 'folder') {
					IterateTree(treeObj.children, path.join(_path, treeObj.name))
				} else {
					result.push({
						[treeObj.name]: JSON.parse(fs.readFileSync(path.join(_path, treeObj.name), 'utf8'))
					})
				}
			})

			return result
		}

		let enemyObjects = IterateTree(res, dir)
		var keys = []
		enemyObjects.forEach(function(item) {
			keys.push(Object.keys(item)[0])
			delete item[keys[keys.length-1]].Randomizer
			item[keys[keys.length-1]].Randomizer = item[keys[keys.length-1]].Randomizer || {}
			item[keys[keys.length-1]].Randomizer.origName = item[keys[keys.length-1]].Randomizer.origName || keys[keys.length-1]
		})

		let indexes = []
		for (let i = 0; i < keys.length; i++) {
			indexes.push(i)
		}
		let shuffledKeys = shuffleSeed.shuffle(indexes, 'This is a complex seed!')

		let temp
		for (let i = 0; i < enemyObjects.length; i++) {
			temp = enemyObjects[i][keys[i]]
			enemyObjects[i][keys[i]] = enemyObjects[shuffledKeys[i]][keys[shuffledKeys[i]]]
			enemyObjects[shuffledKeys[i]][keys[shuffledKeys[i]]] = temp
		}

		function main3(tree, _path) {
			var result3 = []
			tree.forEach(function(treeObj) {
				if (treeObj.type === 'folder') {
					main3(treeObj.children, path.join(_path, treeObj.name))
				} else {
					for (let i = 0; i < enemyObjects.length; i++) {
						console.log(treeObj.name)
						console.log(keys[i])
						console.log()
						if (keys[i] === treeObj.name) {
							fs.writeFile(path.join(_path, treeObj.name), JSON.stringify(enemyObjects[i][keys[i]]), 'utf8', function(err) {
								if(err)
									console.error(err)
							})
							break
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
	}
}

main()
