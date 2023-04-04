const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
    "0xdb0e9be5756f98417244848334ed0371262e3619": 100,
    "0x3000e108064f61959e28d8946d6101bdc752a2e4": 50,
    "0xaf94d0dbaa34b82302efca4c5647c0d5c88a6e69": 75,
};

const privateKeyByAddress = {
    "0xdb0e9be5756f98417244848334ed0371262e3619": "a0f897bc7ae58f806459d88b1d39102e177b18d47e53b9f4d80aacf6a1b8c7ed",
    "0x3000e108064f61959e28d8946d6101bdc752a2e4": "64a692b08731f7ab7c25fb583b50a3396b02922cad831940221b9312537df5b6",
    "0xaf94d0dbaa34b82302efca4c5647c0d5c88a6e69": "a0c128dfe1d8d30e260f8aee9465ad03b02d243b23dcd83f238a82930a30b9c1",
};

app.get("/balance/:address", (req, res) => {
    const { address } = req.params;
    const balance = balances[address] || 0;
    const privateKey = privateKeyByAddress[address];
    res.send({ balance, privateKey });
});

app.post("/send", (req, res) => {
    const { sender, recipient, amount, signature, hexMessage, recoveryBit } = req.body;

    const signaturePublicKey = secp.recoverPublicKey(hexMessage, signature, recoveryBit);
    const signatureAddressNotHex = keccak256(signaturePublicKey.slice(1)).slice(-20);
    const signatureAddress = "0x" + toHex(signatureAddressNotHex);

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
        res.status(400).send({ message: "Not enough funds!" });
    } else if (signatureAddress != sender) {
        res.status(403).send({ message: "Authentication error!" });
    } else {
        balances[sender] -= amount;
        balances[recipient] += amount;
        res.send({ balance: balances[sender] });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
    if (!balances[address]) {
        balances[address] = 0;
    }
}
