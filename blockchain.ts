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

# Calculate block hash
const calculateHash = (index: number, hash: string, previousHash: string, timestamp: number, data: string): string =>
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

# Genesis block
const genesisBlock: Block = new Block(
  0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'So long, and thanks for all the fish.'
);

# Generate next block
const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index + 1;
  const nextTimestamp: number = new Date().getTime() / 1000;
  const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
  return newBlock;
};

# Stores in JS memory array. not permanent!!!
const blockchain: Block[] = [genesisBlock];

# Validates blocks
const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('OOPS! Invalid index.');
    return False;
  } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('OOPS! Invalid previousHash!');
      return False;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
      console.log(typeof (newBlock.hash+ + ' ' + typeof calculateHashForBlock(newBlock));
      

















