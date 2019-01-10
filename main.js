'use strict'
// Loading modules
const fs = require('fs')
const readline = require('readline-sync')
const path = require('path')
const shuffleSeed = require('shuffle-seed')

// Pauses process
function Sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function EditAllJSON(directory, callback) {
	fs.readdir(directory, (err, files) => {
		if (err)
      throw err

    // Handles each folder/file
		files.forEach((file, index) => {
			let fullDir = path.join(directory, file)

			fs.stat(fullDir, (err, stat) => {
				if (err)
					throw err

				if (stat.isDirectory())
					EditAllJSON(fullDir, callback)

				// Gets
        if (stat.isFile()) {
					let jsonData = JSON.parse(fs.readFileSync(fullDir, 'utf8'))
					jsonData = callback(jsonData, fullDir)
					fs.writeFile(fullDir, JSON.stringify(jsonData), 'utf8', err => {
    				if (err)
							throw err
    			})
				}
			})
		})
  })
}

// The actual thing that does stuff
function main() {
  // Starts randomizing the enemies
	/*
	var allFiles = []
	EditAllJSON('C:/Program Files (x86)/Steam/steamapps/common/CrossCode/assets/data/enemies',
		(data, fileName) => {
		data.Randomizer = data.Randomizer || {}
		data.Randomizer.origName = data.Randomizer.origName || file
		allFiles.push(fileName)
		return data
	})
	*/
	console.log(fs.readdirSync('C:/Program Files (x86)/Steam/steamapps/common/CrossCode/assets/data/enemies'))
}

main()
