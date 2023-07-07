"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionPool = exports.getTransactionPool = exports.addToTransactionPool = void 0;
var _ = require("lodash");
var transaction_1 = require("./transaction");
var transactionPool = [];
var getTransactionPool = function () {
    return _.cloneDeep(transactionPool);
};
exports.getTransactionPool = getTransactionPool;
var addToTransactionPool = function (tx, unspentTxOuts) {
    if (!(0, transaction_1.validateTransaction)(tx, unspentTxOuts)) {
        throw Error('Trying to add invalid tx to pool');
    }
    if (!isValidTxForPool(tx, transactionPool)) {
        throw Error('Trying to add invalid tx to pool');
    }
    console.log('adding to txPool: %s', JSON.stringify(tx));
    transactionPool.push(tx);
};
exports.addToTransactionPool = addToTransactionPool;
var hasTxIn = function (txIn, unspentTxOuts) {
    var foundTxIn = unspentTxOuts.find(function (uTxO) {
        return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex;
    });
    return foundTxIn !== undefined;
};
var updateTransactionPool = function (unspentTxOuts) {
    var invalidTxs = [];
    for (var _i = 0, transactionPool_1 = transactionPool; _i < transactionPool_1.length; _i++) {
        var tx = transactionPool_1[_i];
        for (var _a = 0, _b = tx.txIns; _a < _b.length; _a++) {
            var txIn = _b[_a];
            if (!hasTxIn(txIn, unspentTxOuts)) {
                invalidTxs.push(tx);
                break;
            }
        }
    }
    if (invalidTxs.length > 0) {
        console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
        transactionPool = _.without.apply(_, __spreadArray([transactionPool], invalidTxs, false));
    }
};
exports.updateTransactionPool = updateTransactionPool;
var getTxPoolIns = function (aTransactionPool) {
    return _(aTransactionPool)
        .map(function (tx) { return tx.txIns; })
        .flatten()
        .value();
};
var isValidTxForPool = function (tx, aTtransactionPool) {
    var txPoolIns = getTxPoolIns(aTtransactionPool);
    var containsTxIn = function (txIns, txIn) {
        return _.find(txPoolIns, (function (txPoolIn) {
            return txIn.txOutIndex === txPoolIn.txOutIndex && txIn.txOutId === txPoolIn.txOutId;
        }));
    };
    for (var _i = 0, _a = tx.txIns; _i < _a.length; _i++) {
        var txIn = _a[_i];
        if (containsTxIn(txPoolIns, txIn)) {
            console.log('txIn already found in the txPool');
            return false;
        }
    }
    return true;
};
