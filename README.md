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

### Aura IDs and names

The WoW API doesn't include pet battle aura data, so PBM has try and figure out aura ID->name mappings on its own.

Aura IDs are _usually_ one down from the ability that caused them - so PBM assumes that this is the case, and that the aura name and ability name are the same (e.g., aura 217 = ability 218 = Curse of Doom.)

There are a couple edge cases:

- The aura ID is not one-off from the ability ID. There are a few of these, and in this case, PBM has no way to determine the matching ability.
- The aura name and ability name are not the same (e.g., "Cocoon Strike" triggers aura "Silk Cocoon.")

### Name Validation False Positives

The app may show name mismatch warnings in the following cases. Name mismatches don't really mean anything, they're just informational in case you're using this while developing your own script:

- **Aura name mismatches**: As mentioned above, sometimes the ability and aura names don't line up.

- **Name formatting differences**: The ability name written into a script by the author may not exactly match the API name due to typos, capitalization differences, or localization variations (e.g., the script author put the ability name in their local language, and PBM operates off the English localization.)

## License

MIT
