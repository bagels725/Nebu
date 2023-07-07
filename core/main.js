"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var express = require("express");
var _ = require("lodash");
var blockchain_1 = require("./blockchain");
var p2p_1 = require("./p2p");
var transactionPool_1 = require("./transactionPool");
var wallet_1 = require("./wallet");
var httpPort = parseInt(process.env.HTTP_PORT) || 3001;
var p2pPort = parseInt(process.env.P2P_PORT) || 6001;
var initHttpServer = function (myHttpPort) {
    var app = express();
    app.use(bodyParser.json());
    app.use(function (err, req, res, next) {
        if (err) {
            res.status(400).send(err.message);
        }
    });
    app.get('/blocks', function (req, res) {
        res.send((0, blockchain_1.getBlockchain)());
    });
    app.get('/block/:hash', function (req, res) {
        var block = _.find((0, blockchain_1.getBlockchain)(), { 'hash': req.params.hash });
        res.send(block);
    });
    app.get('/transaction/:id', function (req, res) {
        var tx = _((0, blockchain_1.getBlockchain)())
            .map(function (blocks) { return blocks.data; })
            .flatten()
            .find({ 'id': req.params.id });
        res.send(tx);
    });
    app.get('/address/:address', function (req, res) {
        var unspentTxOuts = _.filter((0, blockchain_1.getUnspentTxOuts)(), function (uTxO) { return uTxO.address === req.params.address; });
        res.send({ 'unspentTxOuts': unspentTxOuts });
    });
    app.get('/unspentTransactionOutputs', function (req, res) {
        res.send((0, blockchain_1.getUnspentTxOuts)());
    });
    app.get('/myUnspentTransactionOutputs', function (req, res) {
        res.send((0, blockchain_1.getMyUnspentTransactionOutputs)());
    });
    app.post('/mintRawBlock', function (req, res) {
        if (req.body.data == null) {
            res.send('data parameter is missing');
            return;
        }
        var newBlock = (0, blockchain_1.generateRawNextBlock)(req.body.data);
        if (newBlock === null) {
            res.status(400).send('could not generate block');
        }
        else {
            res.send(newBlock);
        }
    });
    app.post('/mintBlock', function (req, res) {
        var newBlock = (0, blockchain_1.generateNextBlock)();
        if (newBlock === null) {
            res.status(400).send('could not generate block');
        }
        else {
            res.send(newBlock);
        }
    });
    app.get('/balance', function (req, res) {
        var balance = (0, blockchain_1.getAccountBalance)();
        res.send({ 'balance': balance });
    });
    app.get('/address', function (req, res) {
        var address = (0, wallet_1.getPublicFromWallet)();
        res.send({ 'address': address });
    });
    app.post('/mintTransaction', function (req, res) {
        var address = req.body.address;
        var amount = req.body.amount;
        try {
            var resp = (0, blockchain_1.generatenextBlockWithTransaction)(address, amount);
            res.send(resp);
        }
        catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });
    app.post('/sendTransaction', function (req, res) {
        try {
            var address = req.body.address;
            var amount = req.body.amount;
            if (address === undefined || amount === undefined) {
                throw Error('invalid address or amount');
            }
            var resp = (0, blockchain_1.sendTransaction)(address, amount);
            res.send(resp);
        }
        catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });
    app.get('/transactionPool', function (req, res) {
        res.send((0, transactionPool_1.getTransactionPool)());
    });
    app.get('/peers', function (req, res) {
        res.send((0, p2p_1.getSockets)().map(function (s) { return s._socket.remoteAddress + ':' + s._socket.remotePort; }));
    });
    app.post('/addPeer', function (req, res) {
        (0, p2p_1.connectToPeers)(req.body.peer);
        res.send();
    });
    app.post('/stop', function (req, res) {
        res.send({ 'msg': 'stopping server' });
        process.exit();
    });
    app.listen(myHttpPort, function () {
        console.log('Listening http on port: ' + myHttpPort);
    });
};
initHttpServer(httpPort);
(0, p2p_1.initP2PServer)(p2pPort);
(0, wallet_1.initWallet)();
