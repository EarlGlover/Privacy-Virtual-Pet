// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

contract PrivacyVirtualPet {
    using TFHE for euint32;
    using TFHE for euint8;
    using TFHE for ebool;

    struct Pet {
        euint32 happiness;
        euint32 health;
        euint32 energy;
        euint8 petType; // 0=cat, 1=dog, 2=rabbit, 3=bird
        euint32 lastInteraction;
        ebool isEncrypted;
    }

    mapping(address => Pet) private pets;
    mapping(address => bool) public hasPet;

    event PetAction(address indexed owner, string action, bool value);
    event StatsUpdated(address indexed owner, uint32 happiness, uint32 health, uint32 energy);
    event PetCreated(address indexed owner, uint8 petType);

    constructor() {}

    modifier onlyPetOwner() {
        require(hasPet[msg.sender], "You don't have a pet yet");
        _;
    }

    function createPet(uint8 _petType) external {
        require(!hasPet[msg.sender], "You already have a pet");
        require(_petType <= 3, "Invalid pet type");

        pets[msg.sender] = Pet({
            happiness: TFHE.asEuint32(75),
            health: TFHE.asEuint32(80),
            energy: TFHE.asEuint32(60),
            petType: TFHE.asEuint8(_petType),
            lastInteraction: TFHE.asEuint32(uint32(block.timestamp)),
            isEncrypted: TFHE.asEbool(true)
        });

        hasPet[msg.sender] = true;
        emit PetCreated(msg.sender, _petType);
    }

    function feedPet(bool _feed) external onlyPetOwner {
        require(_feed, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Increase happiness and health when feeding
        euint32 happinessBonus = TFHE.asEuint32(10);
        euint32 healthBonus = TFHE.asEuint32(5);

        // Use TFHE operations to update stats privately
        pet.happiness = TFHE.add(pet.happiness, happinessBonus);
        pet.health = TFHE.add(pet.health, healthBonus);

        // Cap at 100
        pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));
        pet.health = TFHE.min(pet.health, TFHE.asEuint32(100));

        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "feed", _feed);
    }

    function playWithPet(bool _play) external onlyPetOwner {
        require(_play, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Playing increases happiness but decreases energy
        euint32 happinessBonus = TFHE.asEuint32(15);
        euint32 energyDecrease = TFHE.asEuint32(10);

        pet.happiness = TFHE.add(pet.happiness, happinessBonus);
        pet.energy = TFHE.sub(pet.energy, energyDecrease);

        // Cap happiness at 100, energy at minimum 0
        pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));
        pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));

        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "play", _play);
    }

    function healPet(bool _heal) external onlyPetOwner {
        require(_heal, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Healing increases health significantly
        euint32 healthBonus = TFHE.asEuint32(20);

        pet.health = TFHE.add(pet.health, healthBonus);
        pet.health = TFHE.min(pet.health, TFHE.asEuint32(100));

        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "heal", _heal);
    }

    function restPet(bool _rest) external onlyPetOwner {
        require(_rest, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Resting increases energy and health slightly
        euint32 energyBonus = TFHE.asEuint32(20);
        euint32 healthBonus = TFHE.asEuint32(5);

        pet.energy = TFHE.add(pet.energy, energyBonus);
        pet.health = TFHE.add(pet.health, healthBonus);

        pet.energy = TFHE.min(pet.energy, TFHE.asEuint32(100));
        pet.health = TFHE.min(pet.health, TFHE.asEuint32(100));

        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "rest", _rest);
    }

    function setPetType(uint8 _petType) external onlyPetOwner {
        require(_petType <= 3, "Invalid pet type");

        Pet storage pet = pets[msg.sender];
        pet.petType = TFHE.asEuint8(_petType);
        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));
    }

    function encryptPetData(bool _encrypt) external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        pet.isEncrypted = TFHE.asEbool(_encrypt);
        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "encrypt", _encrypt);
    }

    // View functions that decrypt data for the pet owner
    function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32) {
        Pet storage pet = pets[msg.sender];

        // Decrypt the values for the owner using proper v0.7.0 syntax
        uint32 happiness = TFHE.decrypt(pet.happiness);
        uint32 health = TFHE.decrypt(pet.health);
        uint32 energy = TFHE.decrypt(pet.energy);

        return (happiness, health, energy);
    }

    function getPetType() external view onlyPetOwner returns (uint8) {
        Pet storage pet = pets[msg.sender];
        return TFHE.decrypt(pet.petType);
    }

    function getLastInteraction() external view onlyPetOwner returns (uint32) {
        Pet storage pet = pets[msg.sender];
        return TFHE.decrypt(pet.lastInteraction);
    }

    function isPetEncrypted() external view onlyPetOwner returns (bool) {
        Pet storage pet = pets[msg.sender];
        return TFHE.decrypt(pet.isEncrypted);
    }

    // Natural decay over time - pets get hungrier and more tired
    function applyTimeDecay() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        uint32 currentTime = uint32(block.timestamp);
        uint32 lastInteraction = TFHE.decrypt(pet.lastInteraction);

        uint32 timeDiff = currentTime - lastInteraction;
        uint32 hoursElapsed = timeDiff / 3600; // Convert seconds to hours

        if (hoursElapsed > 0) {
            // Decay stats over time
            euint32 decay = TFHE.asEuint32(hoursElapsed * 2); // 2 points per hour

            pet.happiness = TFHE.sub(pet.happiness, decay);
            pet.energy = TFHE.sub(pet.energy, decay);

            // Ensure stats don't go below 0
            pet.happiness = TFHE.max(pet.happiness, TFHE.asEuint32(0));
            pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));

            pet.lastInteraction = TFHE.asEuint32(currentTime);
        }
    }

    // Emergency function to reset pet stats (for testing)
    function resetPet() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];

        pet.happiness = TFHE.asEuint32(75);
        pet.health = TFHE.asEuint32(80);
        pet.energy = TFHE.asEuint32(60);
        pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));
    }
}