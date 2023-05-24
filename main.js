const {Blockchain} = require("./blockchain");
const {Transaction} = require("./transaction");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Private Key
const myKeys = ec.keyFromPrivate('insertprivatekeyhere');

// From that we can calculate your public key (which doubles as your wallet address).
const myWalletAddress = myKey.getPublic('hex');

// Create new instance of Blockchain class.
const Nebu = new Blockchain();

// Mine first block.
Nebu.minePendingTransactions(myWalletAddress);

// Creates transaction and signs it with key.
const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKey);
Nebu.addTransaction(tx1);

Nebu.getBalanceOfAddress(myWalletAddress)

// Mine block.
Nebu.minePendingTransactions(myWalletAddress);

// Create second transaction.
const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.signTransaction(myKey);
Nebu.addTransaction(tx2);

// Mine block.
Nebu.minePendingTransaction(myWalletAddress);

console.log();
console.log(Nebu.getBalanceOfAddress(myWalletAddress));

// Checks chain validity.
console.log('Blockchain valid?: ', Nebu.isChainValid() ? 'Yes' : 'No');

console.log(JSON.stringify(Nebu.chain, null, 4));

Nebu.chain[2].transactions[0].amount = 10;
