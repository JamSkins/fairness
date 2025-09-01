/**
 * Provably Fair Calculator - JavaScript Implementation
 * 
 * This is a JavaScript port of the TypeScript provably-fair helper functions
 * from apps/backend/main/src/common/helpers/provably-fair.helper.ts
 */

/**
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
    
    const [lower, upper] = rng;
    if (upper < lower) throw new Error('upper must be ≥ lower');
    
    const totalRange = upper - lower + 1;
    if (count > totalRange) {
        throw new Error(`Cannot generate ${count} unique numbers from range of ${totalRange}`);
    }
    
    // Optimization: if we need more than half the range, generate numbers to exclude
    const shouldUseInversion = count > totalRange / 2;
    const targetCount = shouldUseInversion ? totalRange - count : count;
    
    const range = BigInt(totalRange);
    const MAX_UINT32 = BigInt(0xffffffff); // 2^32 − 1
    const limit = MAX_UINT32 - (MAX_UINT32 % range);
    
    const baseMsg = `${clientSeed}:${nonce}`;
    let digest = bufferToUint8Array(await createHmac(serverSeed, baseMsg));
    
    const results = new Set();
    let cursor = 0;
    let digestIndex = 0;
    
    while (results.size < targetCount) {
        if (cursor + 4 > digest.length) {
            digestIndex += 1;
            const newDigest = bufferToUint8Array(
                await createHmac(serverSeed, `${baseMsg}:${digestIndex}`)
            );
            const combinedLength = digest.length + newDigest.length;
            const combined = new Uint8Array(combinedLength);
            combined.set(digest);
            combined.set(newDigest, digest.length);
            digest = combined;
        }
        
        const num = BigInt(readUInt32BE(digest, cursor));
        cursor += 4;
        
        if (num < limit) {
            const result = Number((num % range) + BigInt(lower));
            if (!results.has(result)) {
                results.add(result);
            }
        }
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
 * Game-specific calculation functions
 */

/**
 * Calculate Dice game result (number from 0.00 to 100.00)
 * @param {string} clientSeed - Client seed
 * @param {string} serverSeed - Server seed
 * @param {number} nonce - Nonce value
 * @returns {Promise<Object>} - Result object with winNumber and hash
 */
async function calculateDiceResult(clientSeed, serverSeed, nonce) {
    const rawNumber = await getNumberFromRange({
        rng: [0, 10000],
        serverSeed,
        nonce,
        clientSeed,
    });
    
    // Convert from 0-10000 to 0.00-100.00
    const winNumber = (rawNumber / 100).toFixed(2);
    
    const hash = await getHashBySeed(serverSeed);
    
    return {
        winNumber: parseFloat(winNumber),
        hash,
    };
}

/**
 * Calculate Wheel game result (sector number from 1 to sectorsCount)
 * @param {string} sessionId - Session ID (used as client seed)
 * @param {string} serverSeed - Server seed
 * @param {number} sectorsCount - Number of sectors on the wheel
 * @returns {Promise<Object>} - Result object with winSectorNumber and hash
 */
async function calculateWheelResult(sessionId, serverSeed, sectorsCount) {
    const winSectorNumber = await getNumberFromRange({
        rng: [1, sectorsCount],
        serverSeed,
        clientSeed: sessionId,
        nonce: 0, // Wheel uses nonce 0
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
        rng: [0, totalRange],
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

// Make functions available globally
window.ProvablyFair = {
    calculateDiceResult,
    calculateWheelResult,
    calculateMinesResult,
    calculateCasesResult,
    getHashBySeed,
    getNumberFromRange,
    getUniqueNumbersFromRange,
};
