// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simplified version without external FHE libraries for demonstration
// In production, use actual FHE libraries like @fhevm/solidity

contract SimplePrivacyVirtualPet {
    struct Pet {
        uint32 happiness;
        uint32 health;
        uint32 energy;
        uint32 petType; // 0=cat, 1=dog, 2=rabbit, 3=bird
        uint32 lastInteraction;
        bool isEncrypted;
    }

    mapping(address => Pet) private pets;
    mapping(address => bool) public hasPet;

    event PetAction(address indexed owner, string action, bool value);
    event StatsUpdated(address indexed owner, uint32 happiness, uint32 health, uint32 energy);
    event PetCreated(address indexed owner, uint32 petType);

    modifier onlyPetOwner() {
        require(hasPet[msg.sender], "You don't have a pet yet");
        _;
    }

    function createPet(uint32 _petType) external {
        require(!hasPet[msg.sender], "You already have a pet");
        require(_petType <= 3, "Invalid pet type");

        pets[msg.sender] = Pet({
            happiness: 75,
            health: 80,
            energy: 60,
            petType: _petType,
            lastInteraction: uint32(block.timestamp),
            isEncrypted: true
        });

        hasPet[msg.sender] = true;
        emit PetCreated(msg.sender, _petType);
    }

    function feedPet(bool _feed) external onlyPetOwner {
        require(_feed, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Increase happiness and health when feeding
        pet.happiness = _min(pet.happiness + 10, 100);
        pet.health = _min(pet.health + 5, 100);
        pet.lastInteraction = uint32(block.timestamp);

        emit PetAction(msg.sender, "feed", _feed);
        emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
    }

    function playWithPet(bool _play) external onlyPetOwner {
        require(_play, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Playing increases happiness but decreases energy
        pet.happiness = _min(pet.happiness + 15, 100);
        pet.energy = _max(pet.energy - 10, 0);
        pet.lastInteraction = uint32(block.timestamp);

        emit PetAction(msg.sender, "play", _play);
        emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
    }

    function healPet(bool _heal) external onlyPetOwner {
        require(_heal, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Healing increases health significantly
        pet.health = _min(pet.health + 20, 100);
        pet.lastInteraction = uint32(block.timestamp);

        emit PetAction(msg.sender, "heal", _heal);
        emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
    }

    function restPet(bool _rest) external onlyPetOwner {
        require(_rest, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Resting increases energy and health slightly
        pet.energy = _min(pet.energy + 20, 100);
        pet.health = _min(pet.health + 5, 100);
        pet.lastInteraction = uint32(block.timestamp);

        emit PetAction(msg.sender, "rest", _rest);
        emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
    }

    function setPetType(uint32 _petType) external onlyPetOwner {
        require(_petType <= 3, "Invalid pet type");

        Pet storage pet = pets[msg.sender];
        pet.petType = _petType;
        pet.lastInteraction = uint32(block.timestamp);
    }

    function encryptPetData(bool _encrypt) external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        pet.isEncrypted = _encrypt;
        pet.lastInteraction = uint32(block.timestamp);

        emit PetAction(msg.sender, "encrypt", _encrypt);
    }

    // View functions
    function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32) {
        Pet storage pet = pets[msg.sender];
        return (pet.happiness, pet.health, pet.energy);
    }

    function getPetType() external view onlyPetOwner returns (uint32) {
        Pet storage pet = pets[msg.sender];
        return pet.petType;
    }

    function getLastInteraction() external view onlyPetOwner returns (uint32) {
        Pet storage pet = pets[msg.sender];
        return pet.lastInteraction;
    }

    function isPetEncrypted() external view onlyPetOwner returns (bool) {
        Pet storage pet = pets[msg.sender];
        return pet.isEncrypted;
    }

    // Natural decay over time
    function applyTimeDecay() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        uint32 currentTime = uint32(block.timestamp);
        uint32 lastInteraction = pet.lastInteraction;

        uint32 timeDiff = currentTime - lastInteraction;
        uint32 hoursElapsed = timeDiff / 3600;

        if (hoursElapsed > 0) {
            uint32 decay = hoursElapsed * 2;
            pet.happiness = _max(pet.happiness - decay, 0);
            pet.energy = _max(pet.energy - decay, 0);
            pet.lastInteraction = currentTime;

            emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
        }
    }

    function resetPet() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];

        pet.happiness = 75;
        pet.health = 80;
        pet.energy = 60;
        pet.lastInteraction = uint32(block.timestamp);

        emit StatsUpdated(msg.sender, pet.happiness, pet.health, pet.energy);
    }

    // Helper functions
    function _min(uint32 a, uint32 b) private pure returns (uint32) {
        return a < b ? a : b;
    }

    function _max(uint32 a, uint32 b) private pure returns (uint32) {
        return a > b ? a : b;
    }
}