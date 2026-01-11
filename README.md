# PetBattleMap

A web-based visualizer for World of Warcraft Pet Battle Scripts.

## Usage

Visit the [live site](https://jfcantu.github.io/PetBattleMap) and paste your PBS script into the text area.

## Development

### Local Setup

```bash
# Start local server
python -m http.server 8000 --directory dist
```

Visit <http://localhost:8000>

### Updating Pet Data

Pet and ability data is automatically updated daily via GitHub Actions.

You can download the latest data files directly from:

- `https://jfcantu.github.io/PetBattleMap/pet-list.json`
- `https://jfcantu.github.io/PetBattleMap/pet-abilities.json`

To manually generate data files:

```bash
# Set OAuth credentials
export OAUTH_CLIENT_ID="your_client_id"
export OAUTH_CLIENT_SECRET="your_client_secret"

# Generate data files
node generate-pet-data.js
```

Get OAuth credentials from the [Blizzard Developer Portal](https://develop.battle.net/).

## Known Issues

### Descriptions

I tried to make sure the descriptions are all in plain English - e.g., "Your active pet's health is below 65%" instead of "Your active pet self.health % < 65". I probably missed some. Open an issue or submit a PR.

### Name Validation False Positives

The app may show name mismatch warnings in the following cases. Name mismatches don't really mean anything, they're just informational in case you're using this while developing your own script:

- **Aura name mismatches**: The WoW API doesn't include pet battle aura data, so the app has to assume aura names match their source ability names. This is usually true, but there are some outliers, like the aura from Cocoon Strike being named Silk Cocoon.

- **Name formatting differences**: Script names may not exactly match API names due to typos, capitalization differences, or localization variations.

## License

MIT
