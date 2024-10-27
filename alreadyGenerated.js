const fs = require("fs")

let story = JSON.parse(fs.readFileSync('./story.json', 'utf-8'))
const keys = Object.keys(story)

const audioGeneratedKeys = fs.readdirSync('./audio').map(filename => filename.replace(".mp3", ""))

for(let i =0; i < keys.length; i++) {
    if (keys[i] in audioGeneratedKeys) {
        story[keys[i]].audio = keys[i] + ".mp3"
    }
}

fs.writeFileSync("story.json")