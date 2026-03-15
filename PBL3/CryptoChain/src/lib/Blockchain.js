import crypto from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import EC from "elliptic";

const ec = new EC.ec("secp256k1"); // Bitcoin/Ethereum curve
const SYSTEM_SENDER = "SYSTEM";

export class Block {
    constructor(index, transactions, prevHash, nonce = 0) {
        this.index = index;
        this.timestamp = Math.floor(Date.now() / 1000); // ✅ fix: Date.now()
        this.transactions = transactions;
        this.prevHash = prevHash;
        this.merkleRoot = constructMerkelTree(transactions); 
        this.nonce = nonce;                                   
        this.hash = this.calculateHash();                     
    }

    calculateHash() {
        const data = this.prevHash + this.nonce + this.merkleRoot;
        return crypto.HmacSHA256(data, "alludam").toString(crypto.enc.Hex);
    }
}

export class Transaction {
    constructor(amount, senderPublicKey, recipientPublicKey, senderPrivateKey) {
        this.amount = amount; // ✅ use "amount" consistently
        this.sender = senderPublicKey;
        this.recipient = recipientPublicKey;
        this.txn_id = uuidv4().split("-").join("");
        this.signature =
            senderPrivateKey && senderPublicKey !== SYSTEM_SENDER
                ? this.signTransaction(senderPrivateKey)
                : null;
    }

    signTransaction(privateKey) {
        const key = ec.keyFromPrivate(privateKey, "hex");
        const dataToSign =
            this.txn_id + this.amount + this.sender + this.recipient;
        const signature = key.sign(crypto.SHA256(dataToSign).toString(), "hex");
        return signature.toDER("hex");
    }

    isValidTransaction() {
        // System transactions are trusted
        if (this.sender === SYSTEM_SENDER) return true;

        // Non-system tx must have a signature
        if (!this.signature) return false;

        const key = ec.keyFromPublic(this.sender, "hex");
        const dataToVerify =
            this.txn_id + this.amount + this.sender + this.recipient;
        return key.verify(crypto.SHA256(dataToVerify).toString(), this.signature);
    }
}

export class Wallet {
    constructor(id, name, balance, publicKey, privateKey) {
        this.id = id; // UUID separate from publicKey (good for React keys)
        this.name = name;
        this.balance = balance;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}

export class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransaction = []; // keep your original name
        this.difficulty = 3;
        this.wallets = [];

        this.chain.push(this.createGenesisBlock());
        this.systemKeyPair = ec.genKeyPair(); 
    }

    createGenesisBlock() {
        return new Block(0, [], "0", 0);
    }

    createTransaction(amount, senderPublicKey, recipientPublicKey, senderPrivateKey) {
        const txn = new Transaction(
            amount,
            senderPublicKey,
            recipientPublicKey,
            senderPrivateKey
        );

        if (!txn.isValidTransaction()) {
            throw new Error("Invalid Transaction error!");
        }

        this.pendingTransaction.push(txn);
        return txn;
    }

    proofOfWork(onNonceUpdate) {
        let nonce = 0;
        const prevHash = this.chain[this.chain.length - 1].hash;
        const merkleRoot = constructMerkelTree(this.pendingTransaction);

        while (true) {
            const hash = crypto
                .HmacSHA256(prevHash + nonce + merkleRoot, "alludam")
                .toString();
            if (hash.startsWith("0".repeat(this.difficulty))) {
                // console.log(`Block mined! Nonce: ${nonce}, Hash: ${hash}`);
                return nonce;
            }
            nonce++;

            if (onNonceUpdate && nonce % 100 === 0) { // update UI every 100 nonces
                onNonceUpdate(nonce);
            }
        }
    }

    // Validate all txns in pending
    validatePendingTransaction() {
        for (const txn of this.pendingTransaction) {
            if (!txn.isValidTransaction()) {
                throw new Error("Invalid transaction detected, abort!!");
            }
        }
    }

    // Mine the pending transactions into a block and then settle balances
    mine(onNonceUpdate = null) {
        if (this.pendingTransaction.length === 0) return;

        this.validatePendingTransaction();

        const nonce = this.proofOfWork(onNonceUpdate);
        const prevHash = this.chain[this.chain.length - 1].hash;
        const newBlock = new Block(
            this.chain.length,
            this.pendingTransaction,
            prevHash,
            nonce
        );

        // ✅ Apply balance changes after successful block creation
        for (const txn of this.pendingTransaction) {
            const sender = this.wallets.find((w) => w.publicKey === txn.sender);
            const recipient = this.wallets.find((w) => w.publicKey === txn.recipient);

            if (sender) sender.balance -= txn.amount;
            if (recipient) recipient.balance += txn.amount;
        }

        this.chain.push(newBlock);
        this.pendingTransaction = [];
        return newBlock;
    }

    //   createWallet(name, balance) {
    //     //  Always create wallet with 0 balance
    //     // Funding (if any) is done at the call site via SYSTEM transaction + mine()
    //     const keyPair = ec.genKeyPair();
    //     const publicKey = keyPair.getPublic("hex");
    //     const privateKey = keyPair.getPrivate("hex");

    //     const newWallet = new Wallet(uuidv4(), name, balance, publicKey, privateKey);
    //     this.wallets.push(newWallet);
    //     return newWallet;
    //   }

    createWallet(name, balance) {
        const { publicKey, privateKey } = generateWalletKeyPair();

        if (publicKey && privateKey) {
            const newWallet = new Wallet(uuidv4(), name, balance, publicKey, privateKey);
            this.wallets.push(newWallet);

            if (balance > 0) {
                const systemWallet = { publicKey: "SYSTEM", privateKey: "" };
                const txn = new Transaction(balance, systemWallet.publicKey, newWallet.publicKey, "");
                this.pendingTransaction.push(txn);

                this.mine();
            }
            return newWallet;
        }
    }

}

function sha256(data) {
    return crypto.HmacSHA256(data, "alludam").toString();
}

// Keep exported name to match your imports
export function constructMerkelTree(transactions) {
    if (!transactions || transactions.length === 0) return "0";

    const leaves = transactions.map((tx) => sha256(JSON.stringify(tx)));

    function build(nodes) {
        if (nodes.length === 1) return nodes[0];
        const next = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = i + 1 < nodes.length ? nodes[i + 1] : left;
            next.push(sha256(left + right));
        }
        return build(next);
    }

    return build(leaves);
}

export function generateWalletKeyPair() {
    const keyPair = ec.genKeyPair();
    return {
        publicKey: keyPair.getPublic("hex"),
        privateKey: keyPair.getPrivate("hex"),
    };
}
