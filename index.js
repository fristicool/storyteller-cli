#!/usr/bin/env node
const sound = require('sound-play')
const inquirer = require('inquirer');
const fs = require("fs")
const path = require('path');

async function main() {
    let currentScene = "start"

    // List all story files in the directory
    const storyFiles = fs.readdirSync('./stories').filter(file => file.endsWith('.json'));

    let storyChoiceDic = new Map();
    let storyChoices = [] 

    for (let i = 0; i < storyFiles.length; i++) {

        const parsedStory = JSON.parse(fs.readFileSync(`${__dirname}/stories/${storyFiles[i]}`, 'utf-8'))

        if (parsedStory["story_metadata"].name) {
            storyChoiceDic.set(parsedStory["story_metadata"].name, storyFiles[i])
            storyChoices.push(parsedStory["story_metadata"].name)
        } else {
            storyChoiceDic.set(storyFiles[i], storyFiles[i])
            storyChoices.push(storyFiles[i])
        }
                
    }

    // Ask the user to choose a story
    const storyChoice = await inquirer.prompt([
        {
            type: 'list',
            name: 'story',
            message: 'Choose a story:',
            choices: storyChoices
        }
    ]);

    // Load the chosen story
    const storyFilePath = path.join('./stories', `${storyChoiceDic.get(storyChoice.story)}`);
    const story = JSON.parse(await fs.promises.readFile(storyFilePath, 'utf8'));

    while (true) {
        if (!(currentScene in story)) break
        currentScene = await displayScene(currentScene, story, storyChoiceDic.get(storyChoice.story).replace('.json', ''))
        console.log()
    }

    console.log("You reached THE END of the Story")
}

main()

function playAudio(audioFileName, FolderPrefix = 'audio') {
    return sound.play(`${__dirname}/${FolderPrefix}/${audioFileName}`)
}

async function displayScene(scene, story, storyName) {
    console.log(story[scene].text)
    if (story[scene].audio) {
        await playAudio(story[scene].audio, "audio/" + storyName )
    }

    let options = Object.keys(story[scene].options)
    let displayOptions = options.map(option => option.replace(/_/g, " "))

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: '',
            choices: displayOptions
        }
    ])
    
    return story[scene].options[answers.choice.replaceAll(" ", "_")];
}
