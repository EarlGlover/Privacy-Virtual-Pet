// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// FHEVM v0.7.0 Compatible Version
// This version simulates FHEVM v0.7.0 functionality while maintaining compatibility

contract PrivacyVirtualPetV07 {
    // Simulated FHE types for v0.7.0 compatibility
    type euint32 is uint256;
    type euint8 is uint256;
    type ebool is uint256;

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

    modifier onlyPetOwner() {
        require(hasPet[msg.sender], "You don't have a pet yet");
        _;
    }

    constructor() {}

    // Simulated FHE functions for v0.7.0 compatibility
    function asEuint32(uint32 value) internal pure returns (euint32) {
        return euint32.wrap(uint256(value));
    }

    function asEuint8(uint8 value) internal pure returns (euint8) {
        return euint8.wrap(uint256(value));
    }

    function asEbool(bool value) internal pure returns (ebool) {
        return ebool.wrap(value ? 1 : 0);
    }

    function decrypt(euint32 value) internal pure returns (uint32) {
        return uint32(euint32.unwrap(value));
    }

    function decrypt(euint8 value) internal pure returns (uint8) {
        return uint8(euint8.unwrap(value));
    }

    function decrypt(ebool value) internal pure returns (bool) {
        return ebool.unwrap(value) == 1;
    }

    function add(euint32 a, euint32 b) internal pure returns (euint32) {
        return euint32.wrap(euint32.unwrap(a) + euint32.unwrap(b));
    }

    function sub(euint32 a, euint32 b) internal pure returns (euint32) {
        uint256 aVal = euint32.unwrap(a);
        uint256 bVal = euint32.unwrap(b);
        return euint32.wrap(aVal > bVal ? aVal - bVal : 0);
    }

    function min(euint32 a, euint32 b) internal pure returns (euint32) {
        uint256 aVal = euint32.unwrap(a);
        uint256 bVal = euint32.unwrap(b);
        return euint32.wrap(aVal < bVal ? aVal : bVal);
    }

    function max(euint32 a, euint32 b) internal pure returns (euint32) {
        uint256 aVal = euint32.unwrap(a);
        uint256 bVal = euint32.unwrap(b);
        return euint32.wrap(aVal > bVal ? aVal : bVal);
    }

    function createPet(uint8 _petType) external {
        require(!hasPet[msg.sender], "You already have a pet");
        require(_petType <= 3, "Invalid pet type");

        pets[msg.sender] = Pet({
            happiness: asEuint32(75),
            health: asEuint32(80),
            energy: asEuint32(60),
            petType: asEuint8(_petType),
            lastInteraction: asEuint32(uint32(block.timestamp)),
            isEncrypted: asEbool(true)
        });

        hasPet[msg.sender] = true;
        emit PetCreated(msg.sender, _petType);
    }

    function feedPet(bool _feed) external onlyPetOwner {
        require(_feed, "Invalid action");

        Pet storage pet = pets[msg.sender];

        // Increase happiness and health when feeding
        euint32 happinessBonus = asEuint32(10);
        euint32 healthBonus = asEuint32(5);

        pet.happiness = add(pet.happiness, happinessBonus);
        pet.health = add(pet.health, healthBonus);

        // Cap at 100
        pet.happiness = min(pet.happiness, asEuint32(100));
        pet.health = min(pet.health, asEuint32(100));

        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "feed", _feed);
        emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }

    function playWithPet(bool _play) external onlyPetOwner {
        require(_play, "Invalid action");

        Pet storage pet = pets[msg.sender];

        euint32 happinessBonus = asEuint32(15);
        euint32 energyDecrease = asEuint32(10);

        pet.happiness = add(pet.happiness, happinessBonus);
        pet.energy = sub(pet.energy, energyDecrease);

        pet.happiness = min(pet.happiness, asEuint32(100));
        pet.energy = max(pet.energy, asEuint32(0));

        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "play", _play);
        emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }

    function healPet(bool _heal) external onlyPetOwner {
        require(_heal, "Invalid action");

        Pet storage pet = pets[msg.sender];

        euint32 healthBonus = asEuint32(20);
        pet.health = add(pet.health, healthBonus);
        pet.health = min(pet.health, asEuint32(100));

        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "heal", _heal);
        emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }

    function restPet(bool _rest) external onlyPetOwner {
        require(_rest, "Invalid action");

        Pet storage pet = pets[msg.sender];

        euint32 energyBonus = asEuint32(20);
        euint32 healthBonus = asEuint32(5);

        pet.energy = add(pet.energy, energyBonus);
        pet.health = add(pet.health, healthBonus);

        pet.energy = min(pet.energy, asEuint32(100));
        pet.health = min(pet.health, asEuint32(100));

        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "rest", _rest);
        emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }

    function setPetType(uint8 _petType) external onlyPetOwner {
        require(_petType <= 3, "Invalid pet type");

        Pet storage pet = pets[msg.sender];
        pet.petType = asEuint8(_petType);
        pet.lastInteraction = asEuint32(uint32(block.timestamp));
    }

    function encryptPetData(bool _encrypt) external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        pet.isEncrypted = asEbool(_encrypt);
        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit PetAction(msg.sender, "encrypt", _encrypt);
    }

    // View functions
    function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32) {
        Pet storage pet = pets[msg.sender];
        return (decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }

    function getPetType() external view onlyPetOwner returns (uint8) {
        Pet storage pet = pets[msg.sender];
        return decrypt(pet.petType);
    }

    function getLastInteraction() external view onlyPetOwner returns (uint32) {
        Pet storage pet = pets[msg.sender];
        return decrypt(pet.lastInteraction);
    }

    function isPetEncrypted() external view onlyPetOwner returns (bool) {
        Pet storage pet = pets[msg.sender];
        return decrypt(pet.isEncrypted);
    }

    function applyTimeDecay() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];
        uint32 currentTime = uint32(block.timestamp);
        uint32 lastInteraction = decrypt(pet.lastInteraction);

        uint32 timeDiff = currentTime - lastInteraction;
        uint32 hoursElapsed = timeDiff / 3600;

        if (hoursElapsed > 0) {
            euint32 decay = asEuint32(hoursElapsed * 2);
            pet.happiness = sub(pet.happiness, decay);
            pet.energy = sub(pet.energy, decay);
            pet.lastInteraction = asEuint32(currentTime);

            emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
        }
    }

    function resetPet() external onlyPetOwner {
        Pet storage pet = pets[msg.sender];

        pet.happiness = asEuint32(75);
        pet.health = asEuint32(80);
        pet.energy = asEuint32(60);
        pet.lastInteraction = asEuint32(uint32(block.timestamp));

        emit StatsUpdated(msg.sender, decrypt(pet.happiness), decrypt(pet.health), decrypt(pet.energy));
    }
}