// blockchain.ts
// Generic blockchain program that Nebu uses.
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

// Calculate block hash
const calculateHash = (index: number, hash: string, previousHash: string, timestamp: number, data: string): string =>
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

// Genesis block
const genesisBlock: Block = new Block(
  0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'So long, and thanks for all the fish.'
);

// Generate next block
const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index + 1;
  const nextTimestamp: number = new Date().getTime() / 1000;
  const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
  return newBlock;
};

// Stores in JS memory array. not permanent!!!
const blockchain: Block[] = [genesisBlock];

// Validates blocks
const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('OOPS! Invalid index.');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('OOPS! Invalid previousHash!');
      return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
      console.log(typeof (newBlock.hash+ + ' ' + typeof calculateHashForBlock(newBlock));
      console.log('OOPS! Invalid Hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
      return false;
  }
  return true;
};

// Validate block structure to check for malformed content.
const isValidBlockStructure = (block: Block): boolean => {
  return typeof block.index === 'number'
      && typeof block.hash === 'string'
      && typeof block.previousHash === 'string'
      && typeof block.timestamp === 'number'
      && typeof block.data === 'string';
};

// Validates blockchain
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

// Blockchain conflict resolver. Chooses longest chain.
const replaceChain = (newBlocks: Block[]) => {                                                  
  if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
    console.log('Recieved blockchain is valid. Replacing current blockchain with recieved blockchain.');
    blockchain = newBlocks;
    broadcastLatest();
  } else {
    console.log('OOPS! Recieved blockchain invalid.');
  }   
};

// Control node
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
        connectToPeers(req.body.peer);
        res.send();
    });

    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort);
    });
};
    
// Get all blocks from node in console: curl http://localhost:3001/blocks
