class Block {

  public index: number;
  public hash: string;
  public previousHash: string;
  public timestamp: number;
  public data: string;
  public difficulty: number;
  public nonce: number;
  public minterBalance: number; // hack to avoid recalculating minter balance at a given height
  public minterAddress: string;
  
  constructor(index: number, hash: string, previousHash: string, timestamp: number, data: Transaction[], difficulty: number, minterBalance: number, minterAddress: string) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.minterBalance = minterBalance;
    this.minterAddress = minterAddress;
  }
}

const genesisBlock: Block = new Block(
  0, '81ac847e9373c8b80edcfb1d0e08da260a73d49b5f33c7c61d6c68a0800155ee', null, 1465154705, 'Forbes 30/4/23 The Kingdom of Bhutan Has Been Quietly Mining Bitcoin For Years'
);

const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index + 1;
  const nextTimestamp: number = new Date().getTime() / 1000;
  const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
  return newBlock;
};

const blockchain: Block[] = [genesisBlock];

const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index +1 !== newBlock.index) {
    console.log('Invalid index!');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('Invalid previousHash!');
    return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
    console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
  }
  return false;
};

const isValidBlockStructure = (block: Block): boolean => {
  return typeof block.index === 'number'
    && typeof block.hash === 'string'
    && typeof block.previousHash === 'string'
    && typeof block.timestamp === 'number'
    && typeof block.data === 'string';
};

const isValidChain = (blockchainToValidate: Block[]): boolean => {
  const isValidGenesis = (block: Block): boolean => {
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

const replaceChain = (newBlocks: Block[]) => {
  if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
    console.log('Recieved blockchain as valid. Replacing current blockchain with recieved blockchain');
    blockchain = newBlocks;
    broadcastLatest();
  } else {
      console.log('Recieved blockchain as invalid');
  }
};
                                               
const initHttpServer = ( myHttpPort: number ) => {
  const app = express();
  app.use(bodyParser.json());
    
  app.get('/blocks', (req, res) => {
    res.send(getBlockchain());
  });
  app.post('/mintBlock', (req, res) => {
    const newBlock: Block = generateNextBlock(req.body.data);
    res.send(newBlock);
  });
  app.get('/peers', (req, res) => {
    res.send(getSockets().map(( s: any ) => s._socket.remoteAddress + ':' + s._socket.remotePort));
  });
  app.post('/addPeer', (req, res) => {
    connectToPeers(req.body.peers);
    res.send();
  });
    
  app.listen(myHttpPort, () => {
    console.log('Listening http on port: ' + myHttpPort);
  });
};  
