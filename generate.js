const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const inquirer = require('inquirer');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "VGYivahfKDDTWSydFKAp"; // Default voice ID - you can change this

async function generateAudio(text, filename, storyFolder) {
    try {
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            data: {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            responseType: 'arraybuffer'
        });

        const audioPath = `./audio/${storyFolder}/${filename}.mp3`;
        fs.writeFileSync(audioPath, response.data);
        console.log(`Generated audio for: ${filename} in ${storyFolder}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
    } catch (error) {
        console.error(`Error generating audio for ${filename}:`, error.message);
        return false;
    }
}

async function generateAllAudio() {
    // List all story files in the directory
    const storyFiles = fs.readdirSync('./stories').filter(file => file.endsWith('.json'));
    const storyChoices = storyFiles.map(file => file.replace('.json', ''));

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
    const storyFilePath = `./stories/${storyChoice.story}.json`;
    const story = JSON.parse(fs.readFileSync(storyFilePath, 'utf8'));

    // Create audio directory for the story if it doesn't exist
    const storyFolder = storyChoice.story;
    if (!fs.existsSync(`./audio/${storyFolder}`)) {
        fs.mkdirSync(`./audio/${storyFolder}`);
    }

    // Keep track of generated audio files
    const generatedAudio = {};

    // Generate audio for each scene
    for (const [sceneKey, scene] of Object.entries(story)) {
        if (scene.text && !scene.audio) {
            const success = await generateAudio(scene.text, sceneKey, storyFolder);
            if (success) {
                generatedAudio[sceneKey] = `${sceneKey}.mp3`;
            }
        }
    }

    // Update story.json with audio file references
    for (const [sceneKey, scene] of Object.entries(story)) {
        if (generatedAudio[sceneKey]) {
            story[sceneKey].audio = generatedAudio[sceneKey];
        }
    }

    // Write updated story back to file
    fs.writeFileSync(storyFilePath, JSON.stringify(story, null, 4));
    console.log(`Story JSON updated with audio references for ${storyFolder}`);
}

// Run the generation
generateAllAudio().catch(console.error);
