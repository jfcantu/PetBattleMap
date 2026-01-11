// Pet ability and pet name lookup using static JSON data
class BlizzardAPI {
    constructor() {
        this.abilityMap = null;
        this.petMap = null;
        this.loadingPromise = this.loadStaticData();
    }

    async loadStaticData() {
        try {
            const [abilitiesResponse, petsResponse] = await Promise.all([
                fetch('pet-abilities.json'),
                fetch('pet-list.json')
            ]);
            this.abilityMap = await abilitiesResponse.json();
            this.petMap = await petsResponse.json();
        } catch (error) {
            console.warn('Failed to load static JSON data:', error);
        }
    }

    async getPetAbilityName(abilityId) {
        // Wait for data to load if not loaded yet
        await this.loadingPromise;

        if (this.abilityMap && this.abilityMap[abilityId]) {
            return this.abilityMap[abilityId];
        }
        return null;
    }

    async getPetName(petId) {
        // Wait for data to load if not loaded yet
        await this.loadingPromise;

        if (this.petMap && this.petMap[petId]) {
            return this.petMap[petId];
        }
        return null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlizzardAPI;
}
