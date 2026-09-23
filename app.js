/**
 * Provably Fair Calculator - Main Application Logic
 */

// UI limit only: the backend does not cap the batch size, but rendering stays responsive.
const FARM_MAX_OPEN_COUNT = 10000;

class ProvablyFairCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupFormHandlers();
        this.setupSampleData();
        this.setupCodeEditor();
        this.setupURLNavigation();
        this.loadFromURL();
    }

    /**
     * Setup tab navigation functionality
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.switchToTab(targetTab);
                this.updateURL(targetTab);
            });
        });
    }

    /**
     * Setup form submission handlers for all games
     */
    setupFormHandlers() {
        // Dice form
        const diceForm = document.getElementById('diceForm');
        diceForm.addEventListener('submit', (e) => this.handleDiceSubmit(e));

        // Double form
        const doubleForm = document.getElementById('doubleForm');
        doubleForm.addEventListener('submit', (e) => this.handleDoubleSubmit(e));

        // Mines form
        const minesForm = document.getElementById('minesForm');
        minesForm.addEventListener('submit', (e) => this.handleMinesSubmit(e));

        // Cases form
        const casesForm = document.getElementById('casesForm');
        casesForm.addEventListener('submit', (e) => this.handleCasesSubmit(e));

        // Farm cases form
        const farmForm = document.getElementById('farmForm');
        farmForm.addEventListener('submit', (e) => this.handleFarmSubmit(e));

        // Upgrader form
        const upgraderForm = document.getElementById('upgraderForm');
        upgraderForm.addEventListener('submit', (e) => this.handleUpgraderSubmit(e));
    }

    /**
     * Setup sample data buttons and functionality
     */
    setupSampleData() {
        // Add sample data buttons to each form
        this.addSampleDataButton('diceForm', this.getDiceSampleData());
        this.addSampleDataButton('doubleForm', this.getDoubleSampleData());
        this.addSampleDataButton('minesForm', this.getMinesSampleData());
        this.addSampleDataButton('casesForm', this.getCasesSampleData());
        this.addSampleDataButton('farmForm', this.getFarmSampleData());
        this.addSampleDataButton('upgraderForm', this.getUpgraderSampleData());
    }

    /**
     * Add sample data button to a form
     */
    addSampleDataButton(formId, sampleData) {
        const form = document.getElementById(formId);
        const submitButton = form.querySelector('.calculate-btn');
        
        const sampleButton = document.createElement('button');
        sampleButton.type = 'button';
        sampleButton.className = 'calculate-btn';
        sampleButton.style.background = '#6c757d';
        sampleButton.style.marginBottom = '10px';
        sampleButton.textContent = 'Load Sample Data';
        
        sampleButton.addEventListener('click', () => {
            Object.keys(sampleData).forEach(key => {
                const input = form.querySelector(`#${key}`);
                if (input) {
                    input.value = sampleData[key];
                }
            });
        });
        
        submitButton.parentNode.insertBefore(sampleButton, submitButton);
        
        // Add share button
        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'calculate-btn';
        shareButton.style.background = '#17a2b8';
        shareButton.style.marginBottom = '10px';
        shareButton.textContent = '🔗 Share URL';
        
        shareButton.addEventListener('click', () => {
            const gameType = formId.replace('Form', '');
            const shareURL = this.generateShareableURL(gameType);
            
            // Copy to clipboard
            navigator.clipboard.writeText(shareURL).then(() => {
                // Update URL in address bar
                window.history.replaceState(null, '', shareURL);
                alert('✅ Shareable URL copied to clipboard and updated in address bar!');
            }).catch(() => {
                // Fallback if clipboard not available
                prompt('Copy this URL:', shareURL);
            });
        });
        
        submitButton.parentNode.insertBefore(shareButton, submitButton);
    }

    /**
     * Sample data for different games
     */
    getDiceSampleData() {
        return {
            diceClientSeed: 'player123',
            diceServerSeed: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
            diceNonce: '1'
        };
    }

    getDoubleSampleData() {
        return {
            doubleSessionId: 'session_abc123',
            doubleServerSeed: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
            doubleSectorsCount: '16'
        };
    }

    getMinesSampleData() {
        return {
            minesClientSeed: 'player456',
            minesServerSeed: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2',
            minesNonce: '2',
            minesGridSize: '25',
            minesMinesCount: '5'
        };
    }

    getCasesSampleData() {
        return {
            casesClientSeed: 'player789',
            casesServerSeed: 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2c3',
            casesNonce: '3',
            casesTotalRange: '2000'
        };
    }

    getFarmSampleData() {
        return {
            farmClientSeed: 'farm-batch',
            farmServerSeed: 'a3f1c9d84b27e650fa1c8d93e47b20516c8ad4f9e0b371c25ad9e846f03b7c12',
            farmNonce: '11',
            farmOpenCount: '8',
            farmTotalRange: '1000000'
        };
    }

    getUpgraderSampleData() {
        return {
            upgraderClientSeed: 'csgo_player',
            upgraderServerSeed: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2c3d4',
            upgraderNonce: '4'
        };
    }

    /**
     * Handle dice form submission
     */
    async handleDiceSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const clientSeed = form.querySelector('#diceClientSeed').value;
        const serverSeed = form.querySelector('#diceServerSeed').value;
        const nonce = parseInt(form.querySelector('#diceNonce').value);
        
        if (!this.validateInputs([clientSeed, serverSeed], [nonce])) return;
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateDiceResult(clientSeed, serverSeed, nonce);
            this.displayDiceResult(result);
        } catch (error) {
            this.displayError('diceResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Handle double form submission
     */
    async handleDoubleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const sessionId = form.querySelector('#doubleSessionId').value;
        const serverSeed = form.querySelector('#doubleServerSeed').value;
        const sectorsCount = parseInt(form.querySelector('#doubleSectorsCount').value);
        
        if (!this.validateInputs([sessionId, serverSeed], [sectorsCount])) return;
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateDoubleResult(sessionId, serverSeed, sectorsCount);
            this.displayDoubleResult(result);
        } catch (error) {
            this.displayError('doubleResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Handle mines form submission
     */
    async handleMinesSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const clientSeed = form.querySelector('#minesClientSeed').value;
        const serverSeed = form.querySelector('#minesServerSeed').value;
        const nonce = parseInt(form.querySelector('#minesNonce').value);
        const gridSize = parseInt(form.querySelector('#minesGridSize').value);
        const minesCount = parseInt(form.querySelector('#minesMinesCount').value);
        
        if (!this.validateInputs([clientSeed, serverSeed], [nonce, gridSize, minesCount])) return;
        
        if (minesCount >= gridSize) {
            this.displayError('minesResult', 'Mines count must be less than grid size');
            return;
        }
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateMinesResult(clientSeed, serverSeed, nonce, gridSize, minesCount);
            this.displayMinesResult(result, gridSize);
        } catch (error) {
            this.displayError('minesResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Handle cases form submission
     */
    async handleCasesSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const clientSeed = form.querySelector('#casesClientSeed').value;
        const serverSeed = form.querySelector('#casesServerSeed').value;
        const nonce = parseInt(form.querySelector('#casesNonce').value);
        const totalRange = parseInt(form.querySelector('#casesTotalRange').value);
        
        if (!this.validateInputs([clientSeed, serverSeed], [nonce, totalRange])) return;
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateCasesResult(clientSeed, serverSeed, nonce, totalRange);
            this.displayCasesResult(result);
        } catch (error) {
            this.displayError('casesResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Handle farm cases form submission
     */
    async handleFarmSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const clientSeed = form.querySelector('#farmClientSeed').value;
        const serverSeed = form.querySelector('#farmServerSeed').value;
        const nonce = parseInt(form.querySelector('#farmNonce').value);
        const openCount = parseInt(form.querySelector('#farmOpenCount').value);
        const totalRange = parseInt(form.querySelector('#farmTotalRange').value);
        
        if (!this.validateInputs([clientSeed, serverSeed], [nonce, openCount, totalRange])) return;
        
        if (openCount < 1 || openCount > FARM_MAX_OPEN_COUNT) {
            this.displayError('farmResult', `Open count must be between 1 and ${FARM_MAX_OPEN_COUNT}`);
            return;
        }
        
        if (totalRange < 1) {
            this.displayError('farmResult', 'Total range must be at least 1');
            return;
        }
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateFarmCasesResult(clientSeed, serverSeed, nonce, openCount, totalRange);
            this.displayFarmResult(result);
        } catch (error) {
            this.displayError('farmResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Handle upgrader form submission
     */
    async handleUpgraderSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const clientSeed = form.querySelector('#upgraderClientSeed').value;
        const serverSeed = form.querySelector('#upgraderServerSeed').value;
        const nonce = parseInt(form.querySelector('#upgraderNonce').value);
        
        if (!this.validateInputs([clientSeed, serverSeed], [nonce])) return;
        
        this.setLoading(form, true);
        
        try {
            const result = await window.ProvablyFair.calculateUpgraderResult(clientSeed, serverSeed, nonce);
            this.displayUpgraderResult(result);
        } catch (error) {
            this.displayError('upgraderResult', error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    /**
     * Validate form inputs
     */
    validateInputs(strings, numbers) {
        for (const str of strings) {
            if (!str || str.trim() === '') {
                alert('Please fill in all fields');
                return false;
            }
        }
        
        for (const num of numbers) {
            if (isNaN(num) || num < 0) {
                alert('Please enter valid positive numbers');
                return false;
            }
        }
        
        return true;
    }

    /**
     * Set loading state for form
     */
    setLoading(form, isLoading) {
        if (isLoading) {
            form.classList.add('loading');
        } else {
            form.classList.remove('loading');
        }
    }

    /**
     * Display dice game result
     */
    displayDiceResult(result) {
        const resultSection = document.getElementById('diceResult');
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Win Number</div>
                <div class="result-value number">${result.winNumber}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Display double game result
     */
    displayDoubleResult(result) {
        const resultSection = document.getElementById('doubleResult');
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Win Sector Number</div>
                <div class="result-value number">${result.winSectorNumber}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Display mines game result
     */
    displayMinesResult(result, gridSize) {
        const resultSection = document.getElementById('minesResult');
        const gridSide = Math.sqrt(gridSize);
        
        // Create mine cells display
        const mineCellsHtml = result.minedCells
            .map(cell => `<span class="mine-cell">${cell}</span>`)
            .join('');
        
        // Create grid visualization
        const gridHtml = this.createMinesGrid(result.minedCells, gridSize);
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Mined Cells</div>
                <div class="result-value array">${mineCellsHtml}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Grid Visualization (${gridSide}x${gridSide})</div>
                ${gridHtml}
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Create mines grid visualization
     */
    createMinesGrid(minedCells, gridSize) {
        const gridSide = Math.sqrt(gridSize);
        
        if (gridSide !== Math.floor(gridSide)) {
            return '<div class="result-value">Grid visualization only available for square grids</div>';
        }
        
        const mineSet = new Set(minedCells);
        let gridHtml = `<div class="mines-grid" style="grid-template-columns: repeat(${gridSide}, 1fr);">`;
        
        for (let i = 1; i <= gridSize; i++) {
            const isMine = mineSet.has(i);
            gridHtml += `<div class="grid-cell ${isMine ? 'mine' : 'safe'}">${isMine ? '💣' : i}</div>`;
        }
        
        gridHtml += '</div>';
        return gridHtml;
    }

    /**
     * Display cases game result
     */
    displayCasesResult(result) {
        const resultSection = document.getElementById('casesResult');
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Random Number</div>
                <div class="result-value number">${result.result}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Display farm cases batch result: every opening in batch order
     */
    displayFarmResult(result) {
        const resultSection = document.getElementById('farmResult');
        const rolls = result.rolls.map(({ roll }) => roll);
        const rowsHtml = result.rolls
            .map(({ index, roll }) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${index}</td>
                    <td class="roll">${roll}</td>
                </tr>`)
            .join('');
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Openings</div>
                <div class="result-value number">${result.rolls.length}</div>
            </div>
            <div class="result-item">
                <div class="result-label">All Openings (batch order)</div>
                <div class="farm-table-wrapper">
                    <table class="farm-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Index</th>
                                <th>Roll</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="result-item">
                <div class="result-label">Rolls (JSON)</div>
                <div class="result-value">${JSON.stringify(rolls)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Display upgrader game result
     */
    displayUpgraderResult(result) {
        const resultSection = document.getElementById('upgraderResult');
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Upgrade Chance</div>
                <div class="result-value number">${result.upgradeChance}%</div>
            </div>
            <div class="result-item">
                <div class="result-label">Server Seed Hash</div>
                <div class="result-value">${result.hash}</div>
            </div>
        `;
        
        resultSection.classList.add('show');
        resultSection.classList.remove('error');
    }

    /**
     * Display error message
     */
    displayError(resultId, message) {
        const resultSection = document.getElementById(resultId);
        
        resultSection.innerHTML = `
            <div class="result-item">
                <div class="result-label">Error</div>
                <div class="result-value">${message}</div>
            </div>
        `;
        
        resultSection.classList.add('show', 'error');
    }

    /**
     * Setup code editor functionality
     */
    setupCodeEditor() {
        this.setupFunctionTabs();
        this.loadOriginalCode();
    }

    /**
     * Setup function tabs navigation
     */
    setupFunctionTabs() {
        const functionTabButtons = document.querySelectorAll('.function-tab-button');
        const functionContents = document.querySelectorAll('.function-content');

        functionTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetFunction = button.getAttribute('data-function');
                
                // Remove active class from all tabs and contents
                functionTabButtons.forEach(btn => btn.classList.remove('active'));
                functionContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(targetFunction).classList.add('active');
            });
        });
    }

    /**
     * Load original code into editors
     */
    async loadOriginalCode() {
        try {
            // Use embedded code instead of fetching
            const coreCode = this.getEmbeddedCoreFunctions();
            const cryptoCode = this.getEmbeddedCryptoFunctions();
            const gamesCode = this.getEmbeddedGamesFunctions();
            
            // Load into editors
            document.getElementById('coreCode').value = coreCode;
            document.getElementById('cryptoCode').value = cryptoCode;
            document.getElementById('gamesCode').value = gamesCode;
            
        } catch (error) {
            console.error('Failed to load original code:', error);
            this.showCodeError('Failed to load original code');
        }
    }

    /**
     * Get embedded core functions
     */
    getEmbeddedCoreFunctions() {
        return `/**
 * Creates HMAC-SHA256 hash using Web Crypto API or crypto-js fallback
 * @param {string} key - The key for HMAC
 * @param {string} message - The message to hash
 * @returns {Promise<ArrayBuffer>} - The hash digest
 */
async function createHmac(key, message) {
    // Try Web Crypto API first (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(message);
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            
            return await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        } catch (error) {
            console.warn('Web Crypto API failed, falling back to crypto-js');
        }
    }
    
    // Fallback: Load crypto-js dynamically if needed
    if (typeof CryptoJS === 'undefined') {
        await loadCryptoJS();
    }
    
    const hash = CryptoJS.HmacSHA256(message, key);
    return hexToArrayBuffer(hash.toString());
}

/**
 * Read a 32-bit big-endian unsigned integer from buffer at given offset
 * @param {Uint8Array} buffer - The buffer to read from
 * @param {number} offset - The offset to read at
 * @returns {number} - The 32-bit unsigned integer
 */
function readUInt32BE(buffer, offset) {
    // Use >>> 0 to convert to unsigned 32-bit integer
    return ((buffer[offset] << 24) | 
           (buffer[offset + 1] << 16) | 
           (buffer[offset + 2] << 8) | 
           buffer[offset + 3]) >>> 0;
}`;
    }

    /**
     * Get embedded crypto functions
     */
    getEmbeddedCryptoFunctions() {
        return `/**
 * Opens the byte stream for one (serverSeed, clientSeed, nonce) triple and returns an
 * async draw function yielding uniformly-distributed integers in [lower, upper].
 *
 * Mirrors the backend's createRangeNumberStream: HMAC derivation, block extension,
 * rejection sampling and modulo mapping live here only. Rejected draws still advance
 * the cursor. Each call to the returned function advances the stream.
 *
 * @param {Object} params - Parameters object
 * @param {[number, number]} params.rng - Range [lower, upper] (inclusive)
 * @param {string} params.serverSeed - Server seed
 * @param {number} params.nonce - Nonce value
 * @param {string} params.clientSeed - Client seed (optional)
 * @returns {Promise<() => Promise<number>>} - Draw function
 */
async function createRangeNumberStream({ rng, serverSeed, nonce, clientSeed = '' }) {
    const [lower, upper] = rng;
    if (upper < lower) throw new Error('upper must be ≥ lower');
    
    const range = BigInt(upper - lower + 1);
    const MAX_UINT32 = BigInt(0xffffffff); // 2^32 − 1
    const limit = MAX_UINT32 - (MAX_UINT32 % range);
    
    const baseMsg = \`\${clientSeed}:\${nonce}\`;
    let digest = bufferToUint8Array(await createHmac(serverSeed, baseMsg));
    let cursor = 0;
    let digestIndex = 0;
    
    return async () => {
        for (;;) {
            if (cursor + 4 > digest.length) {
                // A digest is 32 bytes and blocks are 4 bytes, so the previous digest is
                // always fully consumed here. Continuing on the next digest reads exactly
                // the same bytes as the backend's Buffer.concat, without growing a buffer.
                digestIndex += 1;
                digest = bufferToUint8Array(
                    await createHmac(serverSeed, \`\${baseMsg}:\${digestIndex}\`)
                );
                cursor = 0;
            }
            
            const num = BigInt(readUInt32BE(digest, cursor));
            cursor += 4;
            
            if (num < limit) {
                return Number((num % range) + BigInt(lower));
            }
        }
    };
}

/**
 * Returns unique numbers from a given range using provably fair algorithm
 * @param {Object} params - Parameters object
 * @param {number} params.count - Number of unique numbers to generate
 * @param {[number, number]} params.rng - Range [lower, upper] (inclusive)
 * @param {string} params.serverSeed - Server seed
 * @param {number} params.nonce - Nonce value
 * @param {string} params.clientSeed - Client seed (optional)
 * @returns {Promise<number[]>} - Array of unique numbers
 */
async function getUniqueNumbersFromRange({ count, rng, serverSeed, nonce, clientSeed = '' }) {
    if (count <= 0) throw new Error('count must be > 0');
    
    const draw = await createRangeNumberStream({ rng, serverSeed, nonce, clientSeed });
    
    const [lower, upper] = rng;
    const totalRange = upper - lower + 1;
    if (count > totalRange) {
        throw new Error(\`Cannot generate \${count} unique numbers from range of \${totalRange}\`);
    }
    
    // Optimization: if we need more than half the range, generate numbers to exclude
    const shouldUseInversion = count > totalRange / 2;
    const targetCount = shouldUseInversion ? totalRange - count : count;
    
    const results = new Set();
    while (results.size < targetCount) {
        results.add(await draw());
    }
    
    if (shouldUseInversion) {
        // Return all numbers from range except those in results (inversion)
        const excluded = results;
        const finalResults = [];
        for (let i = lower; i <= upper; i += 1) {
            if (!excluded.has(i)) {
                finalResults.push(i);
            }
        }
        return finalResults;
    }
    
    return Array.from(results);
}

/**
 * Returns \`count\` numbers from a given range WITH replacement (values may repeat).
 * Used by farm case batches: every draw is an independent opening.
 * @param {Object} params - Parameters object
 * @param {number} params.count - Number of values to draw
 * @param {[number, number]} params.rng - Range [lower, upper] (inclusive)
 * @param {string} params.serverSeed - Server seed
 * @param {number} params.nonce - Nonce value
 * @param {string} params.clientSeed - Client seed (optional)
 * @returns {Promise<number[]>} - Numbers in generation order
 */
async function getNumbersFromRange({ count, rng, serverSeed, nonce, clientSeed = '' }) {
    if (count <= 0) throw new Error('count must be > 0');
    
    const draw = await createRangeNumberStream({ rng, serverSeed, nonce, clientSeed });
    
    const numbers = [];
    for (let i = 0; i < count; i += 1) {
        numbers.push(await draw());
    }
    return numbers;
}

/**
 * Returns a single number from a given range using provably fair algorithm
 * @param {Object} params - Parameters object
 * @param {[number, number]} params.rng - Range [lower, upper] (inclusive)
 * @param {string} params.serverSeed - Server seed
 * @param {number} params.nonce - Nonce value
 * @param {string} params.clientSeed - Client seed (optional)
 * @returns {Promise<number>} - Generated number
 */
async function getNumberFromRange({ rng, serverSeed, nonce, clientSeed = '' }) {
    const numbers = await getUniqueNumbersFromRange({
        count: 1,
        rng,
        serverSeed,
        nonce,
        clientSeed,
    });
    
    if (numbers.length === 0) {
        throw new Error('Failed to generate any numbers');
    }
    
    return numbers[0];
}

/**
 * Generate hash from seed using the same algorithm as backend
 * @param {string} seed - The seed to hash
 * @returns {Promise<string>} - Hex hash string
 */
async function getHashBySeed(seed) {
    // Create salt by reversing pairs of characters
    const salt = seed.match(/.{1,2}/g)?.reverse().join('') ?? seed;
    
    if (typeof CryptoJS !== 'undefined') {
        // Use crypto-js if available
        return CryptoJS.HmacSHA256('', seed + salt).toString();
    } else {
        // Use Web Crypto API
        const digest = await createHmac(seed + salt, '');
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

/**
 * Load crypto-js library dynamically
 */
async function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Convert hex string to ArrayBuffer
 * @param {string} hex - Hex string
 * @returns {ArrayBuffer} - ArrayBuffer representation
 */
function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

/**
 * Convert ArrayBuffer to Uint8Array for easier manipulation
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {Uint8Array} - Uint8Array view
 */
function bufferToUint8Array(buffer) {
    return new Uint8Array(buffer);
}`;
    }

    /**
     * Get embedded game functions
     */
    getEmbeddedGamesFunctions() {
        return `/**
 * Calculate Dice game result (number from 0.0000 to 100.0000)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value
 * @returns {Promise<Object>} - Result object with winNumber and hash
 */
async function calculateDiceResult(clientSeed, serverSeed, nonce) {
    const rawNumber = await getNumberFromRange({
        rng: [0, 1000000],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    // Convert from 0-1000000 to 0.0000-100.0000
    const winNumber = (rawNumber / 10000).toFixed(4);
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        winNumber: parseFloat(winNumber),
        hash,
    };
}

/**
 * Calculate Double game result (sector number from 1 to sectorsCount)
 * @param {string} sessionId - Session ID (used as client seed)
 * @param {string} serverSeed - Server seed
 * @param {number} sectorsCount - Number of sectors
 * @returns {Promise<Object>} - Result object with winSectorNumber and hash
 */
async function calculateDoubleResult(sessionId, serverSeed, sectorsCount) {
    const winSectorNumber = await getNumberFromRange({
        rng: [1, sectorsCount],
        serverSeed,
        clientSeed: sessionId,
        nonce: 0, // Double uses nonce 0
    });
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        winSectorNumber,
        hash,
    };
}

/**
 * Calculate Mines game result (mine positions on grid)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value
 * @param {number} gridSize - Total grid size (e.g., 25 for 5x5)
 * @param {number} minesCount - Number of mines
 * @returns {Promise<Object>} - Result object with minedCells and hash
 */
async function calculateMinesResult(clientSeed, serverSeed, nonce, gridSize, minesCount) {
    const minedCells = await getUniqueNumbersFromRange({
        count: minesCount,
        rng: [1, gridSize],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        minedCells,
        hash,
    };
}

/**
 * Calculate Cases game result (number from 0 to totalRange)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value
 * @param {number} totalRange - Total range of items (default 2000)
 * @returns {Promise<Object>} - Result object with result and hash
 */
async function calculateCasesResult(clientSeed, serverSeed, nonce, totalRange = 2000) {
    const result = await getNumberFromRange({
        rng: [1, totalRange],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        result,
        hash,
    };
}

/**
 * Calculate Farm Cases batch result (one nonce for the whole batch)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value (shared by all openings in the batch)
 * @param {number} openCount - Number of openings in the batch
 * @param {number} totalRange - Case total range (default 1000000)
 * @returns {Promise<Object>} - Result object with rolls ({ index, roll }[]) and hash
 */
async function calculateFarmCasesResult(clientSeed, serverSeed, nonce, openCount, totalRange = 1000000) {
    const numbers = await getNumbersFromRange({
        count: openCount,
        rng: [1, totalRange],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        rolls: numbers.map((roll, index) => ({ index, roll })),
        hash,
    };
}

/**
 * Calculate Upgrader game result (upgrade success percentage from 0.0000 to 100.0000)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value
 * @returns {Promise<Object>} - Result object with upgradeChance and hash
 */
async function calculateUpgraderResult(clientSeed, serverSeed, nonce) {
    const rawNumber = await getNumberFromRange({
        rng: [0, 1000000],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    // Convert from 0-1000000 to 0.0000-100.0000 (identical to Dice logic)
    const upgradeChance = (rawNumber / 10000).toFixed(4);
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        upgradeChance: parseFloat(upgradeChance),
        hash,
    };
}`;
    }



    /**
     * Show code-related error
     */
    showCodeError(message) {
        alert(`Code Editor Error: ${message}`);
    }

    /**
     * Setup URL navigation functionality
     */
    setupURLNavigation() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.loadFromURL();
        });
        
        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', () => {
            this.loadFromURL();
        });
    }

    /**
     * Load state from URL
     */
    loadFromURL() {
        const hash = window.location.hash.slice(1); // Remove #
        const [tab, params] = hash.split('?');
        
        // Switch to tab if specified
        if (tab && ['dice', 'double', 'mines', 'cases', 'farm', 'upgrader', 'code'].includes(tab)) {
            this.switchToTab(tab, false); // Don't update URL to avoid loop
        }
        
        // Fill form from URL parameters
        if (params) {
            this.fillFormFromURLParams(tab, params);
        }
    }

    /**
     * Update URL with current tab and form data
     */
    updateURL(tab, includeFormData = false) {
        let url = `#${tab}`;
        
        if (includeFormData && tab !== 'code') {
            const params = this.getFormParams(tab);
            if (params) {
                url += `?${params}`;
            }
        }
        
        // Update URL without triggering navigation
        window.history.replaceState(null, '', url);
    }

    /**
     * Switch to specified tab
     */
    switchToTab(targetTab, updateURL = true) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
        const targetContent = document.getElementById(targetTab);
        
        if (targetButton && targetContent) {
            targetButton.classList.add('active');
            targetContent.classList.add('active');
        }
    }

    /**
     * Fill form from URL parameters
     */
    fillFormFromURLParams(tab, paramString) {
        try {
            const params = new URLSearchParams(paramString);
            
            switch (tab) {
                case 'dice':
                    this.fillDiceForm(params);
                    break;
                case 'double':
                    this.fillDoubleForm(params);
                    break;
                case 'mines':
                    this.fillMinesForm(params);
                    break;
                case 'cases':
                    this.fillCasesForm(params);
                    break;
                case 'farm':
                    this.fillFarmForm(params);
                    break;
                case 'upgrader':
                    this.fillUpgraderForm(params);
                    break;
            }
        } catch (error) {
            console.warn('Failed to parse URL parameters:', error);
        }
    }

    /**
     * Fill dice form from URL parameters
     */
    fillDiceForm(params) {
        const clientSeed = params.get('clientSeed');
        const serverSeed = params.get('serverSeed');
        const nonce = params.get('nonce');
        
        if (clientSeed) document.getElementById('diceClientSeed').value = clientSeed;
        if (serverSeed) document.getElementById('diceServerSeed').value = serverSeed;
        if (nonce) document.getElementById('diceNonce').value = nonce;
    }

    /**
     * Fill double form from URL parameters
     */
    fillDoubleForm(params) {
        const sessionId = params.get('sessionId');
        const serverSeed = params.get('serverSeed');
        const sectorsCount = params.get('sectorsCount');
        
        if (sessionId) document.getElementById('doubleSessionId').value = sessionId;
        if (serverSeed) document.getElementById('doubleServerSeed').value = serverSeed;
        if (sectorsCount) document.getElementById('doubleSectorsCount').value = sectorsCount;
    }

    /**
     * Fill mines form from URL parameters
     */
    fillMinesForm(params) {
        const clientSeed = params.get('clientSeed');
        const serverSeed = params.get('serverSeed');
        const nonce = params.get('nonce');
        const gridSize = params.get('gridSize');
        const minesCount = params.get('minesCount');
        
        if (clientSeed) document.getElementById('minesClientSeed').value = clientSeed;
        if (serverSeed) document.getElementById('minesServerSeed').value = serverSeed;
        if (nonce) document.getElementById('minesNonce').value = nonce;
        if (gridSize) document.getElementById('minesGridSize').value = gridSize;
        if (minesCount) document.getElementById('minesMinesCount').value = minesCount;
    }

    /**
     * Fill cases form from URL parameters
     */
    fillCasesForm(params) {
        const clientSeed = params.get('clientSeed');
        const serverSeed = params.get('serverSeed');
        const nonce = params.get('nonce');
        const totalRange = params.get('totalRange');
        
        if (clientSeed) document.getElementById('casesClientSeed').value = clientSeed;
        if (serverSeed) document.getElementById('casesServerSeed').value = serverSeed;
        if (nonce) document.getElementById('casesNonce').value = nonce;
        if (totalRange) document.getElementById('casesTotalRange').value = totalRange;
    }

    /**
     * Fill farm cases form from URL parameters
     */
    fillFarmForm(params) {
        const clientSeed = params.get('clientSeed');
        const serverSeed = params.get('serverSeed');
        const nonce = params.get('nonce');
        const openCount = params.get('openCount');
        const totalRange = params.get('totalRange');
        
        if (clientSeed) document.getElementById('farmClientSeed').value = clientSeed;
        if (serverSeed) document.getElementById('farmServerSeed').value = serverSeed;
        if (nonce) document.getElementById('farmNonce').value = nonce;
        if (openCount) document.getElementById('farmOpenCount').value = openCount;
        if (totalRange) document.getElementById('farmTotalRange').value = totalRange;
    }

    /**
     * Fill upgrader form from URL parameters
     */
    fillUpgraderForm(params) {
        const clientSeed = params.get('clientSeed');
        const serverSeed = params.get('serverSeed');
        const nonce = params.get('nonce');
        
        if (clientSeed) document.getElementById('upgraderClientSeed').value = clientSeed;
        if (serverSeed) document.getElementById('upgraderServerSeed').value = serverSeed;
        if (nonce) document.getElementById('upgraderNonce').value = nonce;
    }

    /**
     * Get form parameters as URL search string
     */
    getFormParams(tab) {
        const params = new URLSearchParams();
        
        try {
            switch (tab) {
                case 'dice':
                    const diceClientSeed = document.getElementById('diceClientSeed').value;
                    const diceServerSeed = document.getElementById('diceServerSeed').value;
                    const diceNonce = document.getElementById('diceNonce').value;
                    
                    if (diceClientSeed) params.set('clientSeed', diceClientSeed);
                    if (diceServerSeed) params.set('serverSeed', diceServerSeed);
                    if (diceNonce) params.set('nonce', diceNonce);
                    break;
                    
                case 'double':
                    const doubleSessionId = document.getElementById('doubleSessionId').value;
                    const doubleServerSeed = document.getElementById('doubleServerSeed').value;
                    const doubleSectorsCount = document.getElementById('doubleSectorsCount').value;
                    
                    if (doubleSessionId) params.set('sessionId', doubleSessionId);
                    if (doubleServerSeed) params.set('serverSeed', doubleServerSeed);
                    if (doubleSectorsCount) params.set('sectorsCount', doubleSectorsCount);
                    break;
                    
                case 'mines':
                    const minesClientSeed = document.getElementById('minesClientSeed').value;
                    const minesServerSeed = document.getElementById('minesServerSeed').value;
                    const minesNonce = document.getElementById('minesNonce').value;
                    const minesGridSize = document.getElementById('minesGridSize').value;
                    const minesMinesCount = document.getElementById('minesMinesCount').value;
                    
                    if (minesClientSeed) params.set('clientSeed', minesClientSeed);
                    if (minesServerSeed) params.set('serverSeed', minesServerSeed);
                    if (minesNonce) params.set('nonce', minesNonce);
                    if (minesGridSize) params.set('gridSize', minesGridSize);
                    if (minesMinesCount) params.set('minesCount', minesMinesCount);
                    break;
                    
                case 'cases':
                    const casesClientSeed = document.getElementById('casesClientSeed').value;
                    const casesServerSeed = document.getElementById('casesServerSeed').value;
                    const casesNonce = document.getElementById('casesNonce').value;
                    const casesTotalRange = document.getElementById('casesTotalRange').value;
                    
                    if (casesClientSeed) params.set('clientSeed', casesClientSeed);
                    if (casesServerSeed) params.set('serverSeed', casesServerSeed);
                    if (casesNonce) params.set('nonce', casesNonce);
                    if (casesTotalRange) params.set('totalRange', casesTotalRange);
                    break;
                    
                case 'farm':
                    const farmClientSeed = document.getElementById('farmClientSeed').value;
                    const farmServerSeed = document.getElementById('farmServerSeed').value;
                    const farmNonce = document.getElementById('farmNonce').value;
                    const farmOpenCount = document.getElementById('farmOpenCount').value;
                    const farmTotalRange = document.getElementById('farmTotalRange').value;
                    
                    if (farmClientSeed) params.set('clientSeed', farmClientSeed);
                    if (farmServerSeed) params.set('serverSeed', farmServerSeed);
                    if (farmNonce) params.set('nonce', farmNonce);
                    if (farmOpenCount) params.set('openCount', farmOpenCount);
                    if (farmTotalRange) params.set('totalRange', farmTotalRange);
                    break;
                    
                case 'upgrader':
                    const upgraderClientSeed = document.getElementById('upgraderClientSeed').value;
                    const upgraderServerSeed = document.getElementById('upgraderServerSeed').value;
                    const upgraderNonce = document.getElementById('upgraderNonce').value;
                    
                    if (upgraderClientSeed) params.set('clientSeed', upgraderClientSeed);
                    if (upgraderServerSeed) params.set('serverSeed', upgraderServerSeed);
                    if (upgraderNonce) params.set('nonce', upgraderNonce);
                    break;
            }
            
            return params.toString();
        } catch (error) {
            console.warn('Failed to get form parameters:', error);
            return '';
        }
    }

    /**
     * Generate shareable URL for current form state
     */
    generateShareableURL(tab) {
        const baseURL = window.location.origin + window.location.pathname;
        const params = this.getFormParams(tab);
        return `${baseURL}#${tab}${params ? '?' + params : ''}`;
    }
}

// Global functions for code editor controls
function resetToOriginalCode() {
    const calculator = window.provablyFairCalculatorInstance;
    if (calculator) {
        calculator.loadOriginalCode();
    }
}

function updateFunctions() {
    try {
        const coreCode = document.getElementById('coreCode').value;
        const cryptoCode = document.getElementById('cryptoCode').value;
        const gamesCode = document.getElementById('gamesCode').value;
        
        // Create new script element with updated functions
        const newScript = document.createElement('script');
        newScript.textContent = `
            // Updated Core Functions
            ${coreCode}
            
            // Updated Crypto Functions  
            ${cryptoCode}
            
            // Updated Game Functions
            ${gamesCode}
            
            // Update global ProvablyFair object
            window.ProvablyFair = {
                calculateDiceResult,
                calculateDoubleResult,
                calculateMinesResult,
                calculateCasesResult,
                calculateFarmCasesResult,
                calculateUpgraderResult,
                getHashBySeed,
                getNumberFromRange,
                getNumbersFromRange,
                getUniqueNumbersFromRange,
            };
        `;
        
        // Remove old custom script if exists
        const oldScript = document.getElementById('customFunctions');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Add new script
        newScript.id = 'customFunctions';
        document.head.appendChild(newScript);
        
        alert('✅ Functions updated successfully! You can now test the changes.');
        
    } catch (error) {
        alert(`❌ Error updating functions: ${error.message}\n\nCheck the browser console for more details.`);
        console.error('Function update error:', error);
    }
}

function exportCode() {
    const coreCode = document.getElementById('coreCode').value;
    const cryptoCode = document.getElementById('cryptoCode').value;
    const gamesCode = document.getElementById('gamesCode').value;
    
    const fullCode = `// Provably Fair Calculator - Exported Code
// Generated on ${new Date().toISOString()}

//==============================================
// CORE FUNCTIONS
//==============================================
${coreCode}

//==============================================
// CRYPTO FUNCTIONS  
//==============================================
${cryptoCode}

//==============================================
// GAME FUNCTIONS
//==============================================
${gamesCode}

//==============================================
// GLOBAL EXPORT
//==============================================
window.ProvablyFair = {
    calculateDiceResult,
    calculateDoubleResult,
    calculateMinesResult,
    calculateCasesResult,
    calculateFarmCasesResult,
    calculateUpgraderResult,
    getHashBySeed,
    getNumberFromRange,
    getNumbersFromRange,
    getUniqueNumbersFromRange,
};`;

    // Create download
    const blob = new Blob([fullCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'provably-fair-custom.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('📁 Code exported successfully!');
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.provablyFairCalculatorInstance = new ProvablyFairCalculator();
});
