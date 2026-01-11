// Generate pet-list.json and pet-abilities.json from Blizzard API
// Usage: node generate-pet-data.js [client_id] [client_secret]
// Environment variables: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET

const https = require('https');
const fs = require('fs');

// Check environment variables first, then fallback to command line arguments
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || process.argv[2];
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: Missing client credentials.');
    console.error('Usage: node generate-pet-data.js [client_id] [client_secret]');
    console.error('Or set environment variables: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET');
    process.exit(1);
}

// Step 1: Get OAuth token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const options = {
            hostname: 'oauth.battle.net',
            path: '/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data).access_token);
                } else {
                    reject(`Auth failed: ${res.statusCode} ${data}`);
                }
            });
        });

        req.on('error', reject);
        req.write('grant_type=client_credentials');
        req.end();
    });
}

// Step 2: Fetch pet index
function fetchPetIndex(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'us.api.blizzard.com',
            path: '/data/wow/pet/index?namespace=static-us&locale=en_US',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(`Pet index fetch failed: ${res.statusCode} ${data}`);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Step 3: Fetch pet ability index
function fetchPetAbilityIndex(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'us.api.blizzard.com',
            path: '/data/wow/pet-ability/index?namespace=static-us&locale=en_US',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(`Pet ability index fetch failed: ${res.statusCode} ${data}`);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Main execution
async function main() {
    try {
        console.log('Getting access token...');
        const accessToken = await getAccessToken();
        console.log('Access token obtained.\n');

        // Fetch pets
        console.log('Fetching pet index...');
        const petIndex = await fetchPetIndex(accessToken);
        console.log(`Found ${petIndex.pets.length} pets.`);

        // Save raw pet index
        fs.writeFileSync('pet-index-raw.json', JSON.stringify(petIndex, null, 2));
        console.log('✓ pet-index-raw.json saved');

        const petMap = {};
        petIndex.pets.forEach(pet => {
            petMap[pet.id] = pet.name;
        });

        fs.writeFileSync('dist/pet-list.json', JSON.stringify(petMap, null, 2));
        console.log('✓ dist/pet-list.json generated successfully!');
        console.log(`  Total pets: ${Object.keys(petMap).length}\n`);

        // Fetch abilities
        console.log('Fetching pet ability index...');
        const abilityIndex = await fetchPetAbilityIndex(accessToken);
        console.log(`Found ${abilityIndex.abilities.length} abilities.`);

        // Save raw ability index
        fs.writeFileSync('pet-ability-index-raw.json', JSON.stringify(abilityIndex, null, 2));
        console.log('✓ pet-ability-index-raw.json saved');

        const abilityMap = {};
        abilityIndex.abilities.forEach(ability => {
            abilityMap[ability.id] = ability.name;
        });

        fs.writeFileSync('dist/pet-abilities.json', JSON.stringify(abilityMap, null, 2));
        console.log('✓ dist/pet-abilities.json generated successfully!');
        console.log(`  Total abilities: ${Object.keys(abilityMap).length}\n`);

        console.log('All files generated successfully! 🎉');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
