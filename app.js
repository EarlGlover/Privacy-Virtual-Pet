class PrivacyVirtualPet {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
        this.transactionQueue = [];
        this.isProcessingTransaction = false;

        // Sepolia testnet configuration
        this.SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
        this.SEPOLIA_CONFIG = {
            chainId: this.SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia test network',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
        };

        // Contract configuration
        this.contractAddress = '0x2d2548D03606Dd001625BB7015B44E3771f5f700';
        this.contractABI = [
            "function createPet(uint8 _petType) external",
            "function feedPet(bool _feed) external",
            "function playWithPet(bool _play) external",
            "function healPet(bool _heal) external",
            "function restPet(bool _rest) external",
            "function setPetType(uint8 _petType) external",
            "function encryptPetData(bool _encrypt) external",
            "function getPetStats() external view returns (uint32, uint32, uint32)",
            "function getPetType() external view returns (uint8)",
            "function getLastInteraction() external view returns (uint32)",
            "function isPetEncrypted() external view returns (bool)",
            "function applyTimeDecay() external",
            "function resetPet() external",
            "function hasPet(address) external view returns (bool)",
            "event PetAction(address indexed owner, string action, bool value)",
            "event StatsUpdated(address indexed owner, uint32 happiness, uint32 health, uint32 energy)",
            "event PetCreated(address indexed owner, uint8 petType)"
        ];

        // Pet data
        this.petData = {
            type: 'cat',
            name: 'Whiskers',
            happiness: 75,
            health: 80,
            energy: 60,
            avatar: '🐱'
        };

        this.petTypes = {
            cat: { avatar: '🐱', name: 'Whiskers' },
            dog: { avatar: '🐶', name: 'Buddy' },
            rabbit: { avatar: '🐰', name: 'Fluffy' },
            bird: { avatar: '🐦', name: 'Chirpy' }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePetDisplay();
        this.checkWalletConnection();
    }

    async getNextNonce() {
        if (!this.provider || !this.userAddress) {
            throw new Error('Provider or user address not available');
        }

        // Always get the LATEST nonce from the network (including pending transactions)
        const latestNonce = await this.provider.getTransactionCount(this.userAddress, 'latest');
        const pendingNonce = await this.provider.getTransactionCount(this.userAddress, 'pending');

        console.log(`Network nonce - Latest: ${latestNonce}, Pending: ${pendingNonce}`);

        // Use pending nonce as it includes unconfirmed transactions
        const nonce = pendingNonce;

        console.log(`Using nonce: ${nonce}`);
        return nonce;
    }

    async waitForNonceSync() {
        // Wait a bit for network to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async validateContract() {
        try {
            // Check if contract exists at address
            const code = await this.provider.getCode(this.contractAddress);
            if (code === '0x') {
                throw new Error('No contract found at this address');
            }

            // Try to call a view function to test contract
            console.log('Contract validation successful');
            return true;
        } catch (error) {
            console.error('Contract validation failed:', error);
            this.showStatus(`⚠️ Contract validation failed: ${error.message}. The contract may not be deployed on Sepolia.`, 'error');
            return false;
        }
    }

    async queueTransaction(contractMethod, actionName, ...args) {
        return new Promise((resolve, reject) => {
            this.transactionQueue.push({
                contractMethod,
                actionName,
                args,
                resolve,
                reject
            });

            this.processTransactionQueue();
        });
    }

    async processTransactionQueue() {
        if (this.isProcessingTransaction || this.transactionQueue.length === 0) {
            return;
        }

        this.isProcessingTransaction = true;

        try {
            while (this.transactionQueue.length > 0) {
                const transaction = this.transactionQueue.shift();

                try {
                    await this.executeContractTransactionDirect(
                        transaction.contractMethod,
                        transaction.actionName,
                        ...transaction.args
                    );
                    transaction.resolve();
                } catch (error) {
                    transaction.reject(error);
                }

                // Wait a bit between transactions
                if (this.transactionQueue.length > 0) {
                    await this.waitForNonceSync();
                }
            }
        } finally {
            this.isProcessingTransaction = false;
        }
    }

    setupEventListeners() {
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connectWallet());
        }
    }

    async checkWalletConnection() {
        if (typeof window.ethereum === 'undefined') {
            this.showStatus('MetaMask is required to use this application. Please install MetaMask.', 'error');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await this.connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }

    async connectWallet() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                this.showStatus('MetaMask is required! Please install MetaMask to continue.', 'error');
                return;
            }

            this.showStatus('Connecting to MetaMask...', 'info');

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                this.showStatus('Please connect at least one account in MetaMask.', 'error');
                return;
            }

            this.userAddress = accounts[0];

            // Check and switch to Sepolia if needed
            await this.ensureSepoliaNetwork();

            // Create provider and signer using ethers v6
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Initialize contract
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

            // Validate contract deployment
            await this.validateContract();

            this.isConnected = true;
            this.transactionQueue = [];  // Clear transaction queue on new connection
            this.isProcessingTransaction = false;
            this.updateWalletUI(this.userAddress);
            this.showStatus('Successfully connected to Sepolia! ✅', 'success');

            // Load pet data from contract
            await this.loadPetDataFromContract();

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.userAddress = accounts[0];
                    this.updateWalletUI(this.userAddress);
                    this.loadPetDataFromContract();
                }
            });

            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                if (chainId !== this.SEPOLIA_CHAIN_ID) {
                    this.showStatus('Please switch back to Sepolia testnet', 'error');
                } else {
                    this.showStatus('Connected to Sepolia network ✅', 'success');
                }
            });

        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (error.code === 4001) {
                this.showStatus('Connection cancelled by user', 'error');
            } else {
                this.showStatus(`Failed to connect wallet: ${error.message}`, 'error');
            }
        }
    }

    async ensureSepoliaNetwork() {
        try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

            if (currentChainId !== this.SEPOLIA_CHAIN_ID) {
                this.showStatus('Switching to Sepolia testnet...', 'info');

                try {
                    // Try to switch to Sepolia
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: this.SEPOLIA_CHAIN_ID }],
                    });
                } catch (switchError) {
                    // If Sepolia is not added, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [this.SEPOLIA_CONFIG],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to switch to Sepolia network: ${error.message}`);
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;

        const connectButton = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');

        connectButton.textContent = 'Connect Wallet';
        connectButton.disabled = false;
        walletInfo.classList.add('hidden');

        this.showStatus('Wallet disconnected', 'info');
    }

    updateWalletUI(address) {
        const connectButton = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const networkName = document.getElementById('networkName');

        connectButton.textContent = 'Connected ✅';
        connectButton.disabled = true;

        walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
        networkName.textContent = 'Sepolia Testnet';
        walletInfo.classList.remove('hidden');
    }

    async loadPetDataFromContract() {
        if (!this.contract || !this.userAddress) return;

        try {
            this.showStatus('Loading pet data from blockchain...', 'info');

            // Check if user has a pet
            const hasPet = await this.contract.hasPet(this.userAddress);

            if (!hasPet) {
                this.showStatus('No pet found. Creating your first virtual pet...', 'info');
                await this.createNewPet();
                return;
            }

            // Get pet stats from contract
            const [happiness, health, energy] = await this.contract.getPetStats();
            const petType = await this.contract.getPetType();

            // Update local pet data
            this.petData.happiness = Number(happiness);
            this.petData.health = Number(health);
            this.petData.energy = Number(energy);

            // Update pet type
            const typeNames = ['cat', 'dog', 'rabbit', 'bird'];
            const typeName = typeNames[Number(petType)] || 'cat';
            this.petData.type = typeName;
            this.petData.avatar = this.petTypes[typeName].avatar;
            this.petData.name = this.petTypes[typeName].name;

            this.updatePetDisplay();
            this.showStatus('Pet data loaded from blockchain ✅', 'success');

        } catch (error) {
            console.error('Error loading pet data:', error);
            this.showStatus('Error loading pet data from contract', 'error');
        }
    }

    async createNewPet() {
        try {
            await this.executeContractTransaction(
                this.contract.createPet.bind(this.contract),
                'Create Pet',
                0  // Default cat type
            );
        } catch (error) {
            console.error('Error creating pet:', error);
            this.showStatus(`Failed to create pet: ${error.message}`, 'error');
        }
    }

    async executeContractTransaction(contractMethod, actionName, ...args) {
        // Queue the transaction to prevent nonce conflicts
        return this.queueTransaction(contractMethod, actionName, ...args);
    }

    async executeContractTransactionDirect(contractMethod, actionName, ...args) {
        if (!this.contract || !this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        // Check if user has a pet before performing actions (except for createPet)
        if (actionName !== 'Create Pet') {
            try {
                const hasPet = await this.contract.hasPet(this.userAddress);
                if (!hasPet) {
                    this.showStatus('You need to create a pet first! Creating one for you...', 'info');
                    await this.createNewPet();
                    return;
                }
            } catch (error) {
                console.error('Error checking pet existence:', error);
                this.showStatus('Unable to verify pet status. Contract may not be deployed correctly.', 'error');
                return;
            }
        }

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                this.showStatus(`Executing ${actionName}... Please confirm in MetaMask`, 'info');

                // Get fresh nonce from network
                const currentNonce = await this.getNextNonce();

                // Execute transaction without explicit nonce (let ethers handle it)
                const tx = await contractMethod(...args);

                this.showStatus(`Transaction submitted (${tx.hash.substring(0, 10)}...). Waiting for confirmation...`, 'info');

                const receipt = await tx.wait();
                this.showStatus(`${actionName} completed successfully! 🎉`, 'success');

                // Reload pet data after successful transaction
                await this.loadPetDataFromContract();

                // Add extra delay to ensure UI updates properly
                setTimeout(() => {
                    this.updatePetDisplay();
                }, 500);

                // Show transaction link
                this.showTransactionLink(receipt.hash);

                return; // Success, exit retry loop

            } catch (error) {
                console.error(`Error executing ${actionName} (attempt ${retryCount + 1}):`, error);

                if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                    this.showStatus('Transaction cancelled by user', 'error');
                    return; // Don't retry user cancellation
                }

                if (error.code === 'NONCE_EXPIRED' || error.message.includes('nonce')) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        this.showStatus(`Nonce error. Retrying... (${retryCount}/${maxRetries})`, 'info');
                        await this.waitForNonceSync();
                        continue; // Retry
                    } else {
                        this.showStatus('Multiple nonce errors. Please try again later.', 'error');
                        return;
                    }
                }

                if (error.message.includes('insufficient funds')) {
                    this.showStatus('Insufficient ETH for gas fees. Please add Sepolia ETH to your wallet.', 'error');
                    return; // Don't retry insufficient funds
                }

                // Handle contract execution errors
                if (error.message.includes('execution reverted')) {
                    if (error.message.includes('You don\'t have a pet yet')) {
                        this.showStatus('No pet found. Creating one for you...', 'info');
                        await this.createNewPet();
                        return;
                    } else {
                        this.showStatus(`Contract execution failed: The operation was rejected by the smart contract. You may need to create a pet first.`, 'error');
                    }
                } else if (error.reason) {
                    this.showStatus(`Failed: ${error.reason}`, 'error');
                } else {
                    this.showStatus(`Failed to execute ${actionName}: ${error.message}`, 'error');
                }
                return; // Don't retry other errors
            }
        }
    }

    showTransactionLink(txHash) {
        const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        setTimeout(() => {
            this.showStatus(
                `<a href="${explorerUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">View transaction on Etherscan 🔗</a>`,
                'success'
            );
        }, 2000);
    }

    updatePetDisplay() {
        document.getElementById('petAvatar').textContent = this.petData.avatar;
        document.getElementById('petName').textContent = this.petData.name;

        this.updateStatBar('happinessBar', this.petData.happiness);
        this.updateStatBar('healthBar', this.petData.health);
        this.updateStatBar('energyBar', this.petData.energy);
    }

    updateStatBar(barId, value) {
        const bar = document.getElementById(barId);
        if (bar) {
            const clampedValue = Math.max(0, Math.min(100, value));
            bar.style.width = `${clampedValue}%`;
            bar.textContent = `${clampedValue}%`;

            // Change color based on value
            if (clampedValue < 30) {
                bar.style.background = 'linear-gradient(90deg, #f44336, #e91e63)';
            } else if (clampedValue < 60) {
                bar.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
            } else {
                bar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('statusDiv');
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;

        // Auto-hide success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (statusDiv.innerHTML.includes(message)) {
                    statusDiv.innerHTML = '';
                }
            }, 5000);
        }
    }

    // Pet action methods
    async feedPet() {
        await this.executeContractTransaction(
            this.contract.feedPet.bind(this.contract),
            'Feed Pet',
            true
        );
    }

    async playWithPet() {
        await this.executeContractTransaction(
            this.contract.playWithPet.bind(this.contract),
            'Play with Pet',
            true
        );
    }

    async healPet() {
        await this.executeContractTransaction(
            this.contract.healPet.bind(this.contract),
            'Heal Pet',
            true
        );
    }

    async restPet() {
        await this.executeContractTransaction(
            this.contract.restPet.bind(this.contract),
            'Rest Pet',
            true
        );
    }

    async selectPetType(type) {
        if (!this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        // Remove selection from all cards
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Find and select the clicked card by pet type
        const targetCard = document.querySelector(`[onclick="selectPetType('${type}')"]`);
        if (targetCard) {
            targetCard.classList.add('selected');
        }

        if (this.petTypes[type]) {
            // Update local pet data immediately for UI feedback
            this.petData.type = type;
            this.petData.avatar = this.petTypes[type].avatar;
            this.petData.name = this.petTypes[type].name;
            this.updatePetDisplay();

            const typeIndex = Object.keys(this.petTypes).indexOf(type);

            try {
                await this.executeContractTransaction(
                    this.contract.setPetType.bind(this.contract),
                    'Change Pet Type',
                    typeIndex
                );
                this.showStatus(`Pet changed to ${this.petTypes[type].name} ${this.petTypes[type].avatar}`, 'success');
            } catch (error) {
                // Revert local changes if transaction fails
                await this.loadPetDataFromContract();
                this.showStatus('Failed to change pet type', 'error');
            }
        }
    }

    async encryptPetData() {
        if (!this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showStatus('🔐 Encrypting pet data with FHE...', 'info');

            await this.executeContractTransaction(
                this.contract.encryptPetData.bind(this.contract),
                'Encrypt Pet Data',
                true
            );

            this.showStatus('🔒 Pet data encrypted successfully! Your pet stats are now private.', 'success');
        } catch (error) {
            console.error('Error encrypting pet data:', error);
            this.showStatus('Failed to encrypt pet data', 'error');
        }
    }

    async shareSecretly() {
        if (!this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        const shareData = {
            petType: this.petData.type,
            owner: this.userAddress,
            contract: this.contractAddress,
            network: 'Sepolia',
            timestamp: Date.now()
        };

        const encodedData = btoa(JSON.stringify(shareData));
        const shareUrl = `${window.location.origin}?petData=${encodedData}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            this.showStatus('Pet share link copied to clipboard! 📋', 'success');
        } catch (error) {
            this.showStatus('Could not copy to clipboard', 'error');
        }
    }

    async hidePetStats() {
        const statsElements = document.querySelectorAll('.stat-bar');
        statsElements.forEach(stat => {
            stat.style.opacity = stat.style.opacity === '0.1' ? '1' : '0.1';
        });

        const isHidden = statsElements[0].style.opacity === '0.1';
        this.showStatus(`Pet stats ${isHidden ? 'hidden' : 'revealed'} using privacy mode! 👁️`, 'success');
    }

    async applyTimeDecay() {
        if (!this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showStatus('⏱️ Applying time decay to pet stats...', 'info');

            await this.executeContractTransaction(
                this.contract.applyTimeDecay.bind(this.contract),
                'Apply Time Decay'
            );

            // Force reload pet data to show updated stats
            await this.loadPetDataFromContract();
            this.showStatus('⏰ Time decay applied! Pet stats have been updated based on time passed.', 'success');
        } catch (error) {
            console.error('Error applying time decay:', error);
            this.showStatus('Failed to apply time decay', 'error');
        }
    }

    async resetPet() {
        if (confirm('Are you sure you want to reset your pet stats? This action cannot be undone.')) {
            await this.executeContractTransaction(
                this.contract.resetPet.bind(this.contract),
                'Reset Pet Stats'
            );
        }
    }

    async checkContractStatus() {
        if (!this.contract || !this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showStatus('Checking contract status...', 'info');

            // Check contract code
            const code = await this.provider.getCode(this.contractAddress);
            if (code === '0x') {
                this.showStatus('❌ No contract found at this address!', 'error');
                return;
            }

            // Check if user has a pet
            const hasPet = await this.contract.hasPet(this.userAddress);

            let statusMessage = `✅ Contract Status:<br/>`;
            statusMessage += `📍 Address: ${this.contractAddress}<br/>`;
            statusMessage += `🔗 Network: Sepolia Testnet<br/>`;
            statusMessage += `👤 User: ${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}<br/>`;
            statusMessage += `🐾 Has Pet: ${hasPet ? '✅ Yes' : '❌ No'}<br/>`;

            if (hasPet) {
                try {
                    const [happiness, health, energy] = await this.contract.getPetStats();
                    const petType = await this.contract.getPetType();
                    statusMessage += `📊 Stats: H:${happiness} HP:${health} E:${energy}<br/>`;
                    statusMessage += `🎭 Type: ${['Cat', 'Dog', 'Rabbit', 'Bird'][petType] || 'Unknown'}`;
                } catch (error) {
                    statusMessage += `⚠️ Could not load pet stats: ${error.message}`;
                }
            }

            this.showStatus(statusMessage, 'success');

        } catch (error) {
            console.error('Error checking contract status:', error);
            this.showStatus(`❌ Contract check failed: ${error.message}`, 'error');
        }
    }

    async forceCreatePet() {
        if (!this.contract || !this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return;
        }

        if (confirm('This will attempt to create a new pet. Continue?')) {
            try {
                this.showStatus('🆕 Creating new pet...', 'info');

                await this.executeContractTransaction(
                    this.contract.createPet.bind(this.contract),
                    'Force Create Pet',
                    0  // Cat type
                );

                // Force reload pet data to show the new pet
                await this.loadPetDataFromContract();
                this.showStatus('🎉 New pet created successfully! Welcome your new companion!', 'success');
            } catch (error) {
                console.error('Error force creating pet:', error);
                this.showStatus(`Failed to create pet: ${error.message}`, 'error');
            }
        }
    }
}

// Global functions for onclick handlers
let petApp;

function feedPet() {
    if (petApp) petApp.feedPet();
}

function playWithPet() {
    if (petApp) petApp.playWithPet();
}

function healPet() {
    if (petApp) petApp.healPet();
}

function restPet() {
    if (petApp) petApp.restPet();
}

function selectPetType(type) {
    if (petApp) {
        petApp.selectPetType(type);
    }
}

function encryptPetData() {
    if (petApp) petApp.encryptPetData();
}

function shareSecretly() {
    if (petApp) petApp.shareSecretly();
}

function hidePetStats() {
    if (petApp) petApp.hidePetStats();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    petApp = new PrivacyVirtualPet();

    // Check for shared pet data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const petData = urlParams.get('petData');
    if (petData) {
        try {
            const decodedData = JSON.parse(atob(petData));
            petApp.showStatus(`Viewing shared pet from ${decodedData.owner.substring(0, 6)}...${decodedData.owner.substring(38)} 🔗`, 'info');
        } catch (error) {
            console.error('Error parsing shared pet data:', error);
        }
    }
});