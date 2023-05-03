class Block {

  public index: number;
  public hash: string;
  public previousHash: string;
  public timestamp: number;
  public data: string;
  
  constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
  }
}

const genesisBlock: Block = new Block(
  0, '81ac847e9373c8b80edcfb1d0e08da260a73d49b5f33c7c61d6c68a0800155ee', null, 1465154705, 'Forbes 30/4/23 The Kingdom of Bhutan Has Been Quietly Mining Bitcoin For Years'
);

const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex
