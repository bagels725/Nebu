const SHA256 = require('crypto-js/sha256');
const {Transaction} = require("./transaction");
const {Block} = require("./block");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 10000; // Kludge that controls time it takes to mine a block.
    this.pendingTransactions = []; // Transactions to be mined into next block.
    this.miningReward = 100; // Yet another kludge. Controls mining reward.
  }
  
  createGenesisBlock() {
    return new Block(Date.parse('2023-05-24'), [], '0');
  }
  
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
  
  minePendingTransactions(minerRewardAddress) {
    // Mine all pending transactions and add them to a new block.
    let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty, 100.); // Todo: Fix Balance.
    
    this.chain.push(block);
    
    // Reset pending transactions and give block reward to miner in next block.
    // Important to delay block rewards for security reasons.
    this.pendingTransactions = [
      new Transaction(null, minerRewardAddress, this.miningReward)
    ];
  }
  
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("OOPS! Transaction must have a TO and FROM address.")
    }
    
    if (!transaction.isValid()) {
      throw new Error("OOPS! Transaction not valid.")
    }
    
    if (transaction.amount <= 0) {
      throw new Error("OOPS! Transaction amount must be larger than 0")
    }
    
    if (this.getBalanceofAddress(transaction.fromAddress) < transaction.amount) {
      throw new Error("OOPS! Balance too low.")
    }
    
    this.pendingTransactions.push(transaction);
  }
  
  getBalanceOfAddress(address) {
    let balance = 0.;
  
    for (const block of this.chain) {
      for (const trans of block.transactions){
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }
        
        if (trans.toAddress === address) {
          balance += trans.amount
        }
      }
    }
    
    return "Amount of " + balance + " Owned by " + address
  }
  
  getAllTransactionsForWallet(address) {
    // Get all transactions for a given wallet
    const txs = []
    
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if(tx.fromAddress == address || tx.toAddress == address) {
          txs.push(tx)
        }
      }
    }
  }
  
  isChainValid() {
    // Check if the Genesis block hasn't been tampered with by comparing the output of createGenesisBlock with the first block on chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());
    
    if (realGenesis !== JSON.stringify(this.chain[0])) {
      console.log("OOPS! Invalid genesis block.");
      return false;
    }
    
    // Check the remaining blocks on the chain to see if their hashes and signatures are correct
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      const currentBlockTimestamp = currentBlock.timestamp
      
      if (previousBlock.hash !== currentBlock.previousHash) {
        console.log('OOPS! Invalid previous hash.')
        return false;
      }
      
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log(currentBlock)
        console.log('OOPS! Invalid hash.')
        return false;
      }
      
      if (!currentBlock.hasValidTransaction()) {
        console.log('OOPS! Invalid transactions in new block.')
        return false;
      }
      
      if (!currentBlock.isValidBlockStructure()) {
        console.log('Invalid block structure')
        return false
      }
    }
    
    return true;
  }
  // Need to make doohickey for resolving parallel chain conflict.
  
}

module.exports.Blockchain = Blockchain

    
}
    
