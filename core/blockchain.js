"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBlockToChain = exports.replaceChain = exports.isValidBlockStructure = exports.getAccountBalance = exports.getMyUnspentTransactionOutputs = exports.handleReceivedTransaction = exports.generatenextBlockWithTransaction = exports.generateNextBlock = exports.generateRawNextBlock = exports.sendTransaction = exports.getLatestBlock = exports.getUnspentTxOuts = exports.getBlockchain = exports.Block = void 0;
var CryptoJS = require("crypto-js");
var _ = require("lodash");
var p2p_1 = require("./p2p");
var transaction_1 = require("./transaction");
var transactionPool_1 = require("./transactionPool");
var wallet_1 = require("./wallet");
var bignumber_js_1 = require("bignumber.js");
var Block = /** @class */ (function () {
    function Block(index, hash, previousHash, timestamp, data, difficulty, minterBalance, minterAddress) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.minterBalance = minterBalance;
        this.minterAddress = minterAddress;
    }
    return Block;
}());
exports.Block = Block;
var genesisTransaction = {
    'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
    'txOuts': [{
            'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
            'amount': 50
        }],
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};
var genesisBlock = new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0, "04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a");
// Number of blocks that can be minted with accounts without any coins
var mintingWithoutCoinIndex = 100;
var blockchain = [genesisBlock];
// the unspent txOut of genesis block is set to unspentTxOuts on startup
var unspentTxOuts = (0, transaction_1.processTransactions)(blockchain[0].data, [], 0);
var getBlockchain = function () { return blockchain; };
exports.getBlockchain = getBlockchain;
var getUnspentTxOuts = function () { return _.cloneDeep(unspentTxOuts); };
exports.getUnspentTxOuts = getUnspentTxOuts;
// and txPool should be only updated at the same time
var setUnspentTxOuts = function (newUnspentTxOut) {
    unspentTxOuts = newUnspentTxOut;
};
var getLatestBlock = function () { return blockchain[blockchain.length - 1]; };
exports.getLatestBlock = getLatestBlock;
// in seconds
var BLOCK_GENERATION_INTERVAL = 10;
// in blocks
var DIFFICULTY_ADJUSTMENT_INTERVAL = 10;
var getDifficulty = function (aBlockchain) {
    var latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    }
    else {
        return latestBlock.difficulty;
    }
};
var getAdjustedDifficulty = function (latestBlock, aBlockchain) {
    var prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    var timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    var timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock.difficulty + 1;
    }
    else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    }
    else {
        return prevAdjustmentBlock.difficulty;
    }
};
var getCurrentTimestamp = function () { return Math.round(new Date().getTime() / 1000); };
var generateRawNextBlock = function (blockData) {
    var previousBlock = getLatestBlock();
    var difficulty = getDifficulty(getBlockchain());
    var nextIndex = previousBlock.index + 1;
    var newBlock = findBlock(nextIndex, previousBlock.hash, blockData, difficulty);
    if (addBlockToChain(newBlock)) {
        (0, p2p_1.broadcastLatest)();
        return newBlock;
    }
    else {
        return null;
    }
};
exports.generateRawNextBlock = generateRawNextBlock;
// gets the unspent transaction outputs owned by the wallet
var getMyUnspentTransactionOutputs = function () {
    return (0, wallet_1.findUnspentTxOuts)((0, wallet_1.getPublicFromWallet)(), getUnspentTxOuts());
};
exports.getMyUnspentTransactionOutputs = getMyUnspentTransactionOutputs;
var generateNextBlock = function () {
    var coinbaseTx = (0, transaction_1.getCoinbaseTransaction)((0, wallet_1.getPublicFromWallet)(), getLatestBlock().index + 1);
    var blockData = [coinbaseTx].concat((0, transactionPool_1.getTransactionPool)());
    return generateRawNextBlock(blockData);
};
exports.generateNextBlock = generateNextBlock;
var generatenextBlockWithTransaction = function (receiverAddress, amount) {
    if (!(0, transaction_1.isValidAddress)(receiverAddress)) {
        throw Error('invalid address');
    }
    if (typeof amount !== 'number') {
        throw Error('invalid amount');
    }
    var coinbaseTx = (0, transaction_1.getCoinbaseTransaction)((0, wallet_1.getPublicFromWallet)(), getLatestBlock().index + 1);
    var tx = (0, wallet_1.createTransaction)(receiverAddress, amount, (0, wallet_1.getPrivateFromWallet)(), getUnspentTxOuts(), (0, transactionPool_1.getTransactionPool)());
    var blockData = [coinbaseTx, tx];
    return generateRawNextBlock(blockData);
};
exports.generatenextBlockWithTransaction = generatenextBlockWithTransaction;
var findBlock = function (index, previousHash, data, difficulty) {
    var pastTimestamp = 0;
    while (true) {
        var timestamp = getCurrentTimestamp();
        if (pastTimestamp !== timestamp) {
            var hash = calculateHash(index, previousHash, timestamp, data, difficulty, getAccountBalance(), (0, wallet_1.getPublicFromWallet)());
            if (isBlockStakingValid(previousHash, (0, wallet_1.getPublicFromWallet)(), timestamp, getAccountBalance(), difficulty, index)) {
                return new Block(index, hash, previousHash, timestamp, data, difficulty, getAccountBalance(), (0, wallet_1.getPublicFromWallet)());
            }
            pastTimestamp = timestamp;
        }
    }
};
var getAccountBalance = function () {
    return (0, wallet_1.getBalance)((0, wallet_1.getPublicFromWallet)(), getUnspentTxOuts());
};
exports.getAccountBalance = getAccountBalance;
var sendTransaction = function (address, amount) {
    var tx = (0, wallet_1.createTransaction)(address, amount, (0, wallet_1.getPrivateFromWallet)(), getUnspentTxOuts(), (0, transactionPool_1.getTransactionPool)());
    (0, transactionPool_1.addToTransactionPool)(tx, getUnspentTxOuts());
    (0, p2p_1.broadCastTransactionPool)();
    return tx;
};
exports.sendTransaction = sendTransaction;
var calculateHashForBlock = function (block) {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.minterBalance, block.minterAddress);
};
var calculateHash = function (index, previousHash, timestamp, data, difficulty, minterBalance, minterAddress) {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + minterBalance + minterAddress).toString();
};
// The hash for Proof of Stake does not include a nonce to avoid more than one trial per second
var isValidBlockStructure = function (block) {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'object'
        && typeof block.difficulty === 'number'
        && typeof block.minterBalance === 'number'
        && typeof block.minterAddress === 'string';
};
exports.isValidBlockStructure = isValidBlockStructure;
var isValidNewBlock = function (newBlock, previousBlock) {
    if (!isValidBlockStructure(newBlock)) {
        console.log('invalid block structure: %s', JSON.stringify(newBlock));
        return false;
    }
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    }
    else if (!isValidTimestamp(newBlock, previousBlock)) {
        console.log('invalid timestamp');
        return false;
    }
    else if (!hasValidHash(newBlock)) {
        return false;
    }
    return true;
};
var getAccumulatedDifficulty = function (aBlockchain) {
    return aBlockchain
        .map(function (block) { return block.difficulty; })
        .map(function (difficulty) { return Math.pow(2, difficulty); })
        .reduce(function (a, b) { return a + b; });
};
var isValidTimestamp = function (newBlock, previousBlock) {
    return (previousBlock.timestamp - 60 < newBlock.timestamp)
        && newBlock.timestamp - 60 < getCurrentTimestamp();
};
var hasValidHash = function (block) {
    if (!hashMatchesBlockContent(block)) {
        console.log('invalid hash, got:' + block.hash);
        return false;
    }
    if (!isBlockStakingValid(block.previousHash, block.minterAddress, block.minterBalance, block.timestamp, block.difficulty, block.index)) {
        console.log('staking hash not lower than balance over diffculty times 2^256');
    }
    return true;
};
var hashMatchesBlockContent = function (block) {
    var blockHash = calculateHashForBlock(block);
    return blockHash === block.hash;
};
// This function is used for proof of stake
// Based on `SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff`
// Cf https://blog.ethereum.org/2014/07/05/stake/
var isBlockStakingValid = function (prevhash, address, timestamp, balance, difficulty, index) {
    difficulty = difficulty + 1;
    // Allow minting without coins for a few blocks
    if (index <= mintingWithoutCoinIndex) {
        balance = balance + 1;
    }
    var balanceOverDifficulty = new bignumber_js_1.BigNumber(2).exponentiatedBy(256).times(balance).dividedBy(difficulty);
    var stakingHash = CryptoJS.SHA256(prevhash + address + timestamp).toString();
    var decimalStakingHash = new bignumber_js_1.BigNumber(stakingHash, 16);
    var difference = balanceOverDifficulty.minus(decimalStakingHash).toNumber();
    return difference >= 0;
};
/*
    Checks if the given blockchain is valid. Return the unspent txOuts if the chain is valid
 */
var isValidChain = function (blockchainToValidate) {
    console.log('isValidChain:');
    console.log(JSON.stringify(blockchainToValidate));
    var isValidGenesis = function (block) {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if (!isValidGenesis(blockchainToValidate[0])) {
        return null;
    }
    /*
    Validate each block in the chain. The block is valid if the block structure is valid
      and the transaction are valid
     */
    var aUnspentTxOuts = [];
    for (var i = 0; i < blockchainToValidate.length; i++) {
        var currentBlock = blockchainToValidate[i];
        if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return null;
        }
        aUnspentTxOuts = (0, transaction_1.processTransactions)(currentBlock.data, aUnspentTxOuts, currentBlock.index);
        if (aUnspentTxOuts === null) {
            console.log('invalid transactions in blockchain');
            return null;
        }
    }
    return aUnspentTxOuts;
};
var addBlockToChain = function (newBlock) {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        var retVal = (0, transaction_1.processTransactions)(newBlock.data, getUnspentTxOuts(), newBlock.index);
        if (retVal === null) {
            console.log('block is not valid in terms of transactions');
            return false;
        }
        else {
            blockchain.push(newBlock);
            setUnspentTxOuts(retVal);
            (0, transactionPool_1.updateTransactionPool)(unspentTxOuts);
            return true;
        }
    }
    return false;
};
exports.addBlockToChain = addBlockToChain;
var replaceChain = function (newBlocks) {
    var aUnspentTxOuts = isValidChain(newBlocks);
    var validChain = aUnspentTxOuts !== null;
    if (validChain &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        setUnspentTxOuts(aUnspentTxOuts);
        (0, transactionPool_1.updateTransactionPool)(unspentTxOuts);
        (0, p2p_1.broadcastLatest)();
    }
    else {
        console.log('Received blockchain invalid');
    }
};
exports.replaceChain = replaceChain;
var handleReceivedTransaction = function (transaction) {
    (0, transactionPool_1.addToTransactionPool)(transaction, getUnspentTxOuts());
};
exports.handleReceivedTransaction = handleReceivedTransaction;
