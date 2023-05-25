/*
We will start by defining the block structure. Only the most essential properties are included at the block at this point.

index: The height of the block in the blockchain.
data: Any data that is included in the block.
timestamp: A timestamp.
hash: A SHA256 hash taken from the content of the block.
previousHash: A reference to the hash of the previous block. This value explicitly defines the previous block.
*/

class Block {

  public index: number;
  public hash: string;
  public previousHash: string;
  public timestamp: number;
  public data: string;
  
  constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

/*
The block hash is one of the most important properties of the block. The hash is calculated over all data of the block.
This means that if anything in the block changes, the original hash is no longer valid. The block hash can also be
thought of as the unique identifier of the block. For instance, blocks with the same index can appear, but they all have
unique hashes.

It should be noted that the block hash has not yet anything to do with mining, as there is no PoW problem to solve. We use
block hashes to preserve integrity of the block and to explicitly reference the previous block.
*/

const calculateHash = (index: number, previousHash: string, timestamp: number, data: string): string =>
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString()

// Genesis block is the first block in the chain. It is the only block that has no previousHash, and thus we will hard code
// the genesis block.

const genesisBlock: Block = new Block(
  0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'my genesis block!!'
);

/*
To generate a block we must know the hash of the previous block and create the rest of the required content (index, hash, data
and timestamp). Block data is something that is provided by the end-user but the rest of the parameters will be generated using
the following code:
*/

const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index +1;
  const nextTimestamp: number = new Date().getTime() / 1000;
  const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
  return newBlock;
};

// For now we will only use an in-memory Javascript array to store the blockchain. This means the data will not persist when the
// node is terminated.

const blockchain: Block[] = [genesisBlock];

/*
At any given time, we must be able to validate if a block or blockchain are valid in terms of integrity. This is true especially
when we recieve new blocks from other nodes and must decide whether to accept them or not. For a block to be valid, the following
must apply:

  1. The INDEX of the block must be one number larger than the previous.
  2. The PREVIOUSHASH of the block must match the hash of the previous block.
  3. The HASH of the block itself must be valid.
*/

const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('OOPS! Invalid index.');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('OOPS! Invalid previous hash.');
    return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
    console.log('OOPS! Invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
    return false;
  }
  return true;
};

// We must also validate the structure of the block, so that malformed content sent by a peer won't crash our node.

const isValidBlockStructure = (block: Block): boolean => {
  return typeof block.index === 'number'
      && typeof block.hash === 'string'
      && typeof block.previousHash === 'string'
      && typeof block.timestamp === 'number'
      && typeof block.data === 'string';
};

/*
Now that we have a means to validate a single block, we can move on to validate a full blockchain. We first check that the first
block in the chain matches with the genesisBlock. After that, we validate every consecutive block using the previously described
methods.
*/

const isValidChain = (blockchainToValidate: Block[]): boolean => {
  const isValidGenesis = (block Block): boolean => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };

  if (!isValidGenesis(blockchainToValidate[0])) {
    return false;
  }

  for (let i = 1; i < blockchainToValidate.length; i++) {
    if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
      return false;
    }                                              
  }                                                
  return true;                                               
                                                  
};
                                                  
// There should always be one explicit set of blocks in the chain at a given time. In case of conflicts (e.g. two nodes both
// generate block number 72) we choose the chain that has the longest number of blocks.
                                                  
const replaceChain = (newBlocks: Block[]) => {
  if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
    console.log('Recieved blockchain is valid. Updating current blockchain.');
    blockchain = newBlocks;
    broadcastLatest();
  } else {
    console.log('OOPS! Recieved blockchain invalid.');
  }
};
