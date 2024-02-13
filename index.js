const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1')
const { ECPairFactory } = require('ecpair');
const { SHA256 } = require('crypto-js');
const fs = require('fs')


const network = bitcoin.networks.regtest;
const ECPair = ECPairFactory(ecc)
const keyPair = ECPair.makeRandom({ network })
const privateKeyWIF = keyPair.toWIF()

// const preImage = "Btrust Builders";
const lock_hex = "427472757374204275696c64657273"
// console.log(`OP_SHA256 ${lock_hex} OP_EQUAL`)
const redeemScript = bitcoin.script.fromASM(`OP_SHA256 ${lock_hex} OP_EQUAL`)

// Convert the redeem script to hex format
const redeemScriptHex = redeemScript.toString('hex');
console.log("Redeem script in hex format:", redeemScriptHex);

function p2pkhAddress() {
  const p2pkhAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;
  fs.writeFileSync('keypair.txt', keyPair.toWIF())
  console.log(`p2pkh address: ${p2pkhAddress}`)
}
// p2pkhtxid: 3c8db9bc0e2f0145b4932e478a1b114b061c6e6142de4311eaea812acc7ca173
// p2pkhAddress()


const p2shAddress = bitcoin.payments.p2sh({
  redeem: { output: redeemScript, network },
  network: bitcoin.networks.regtest
}).address;
console.log("P2SH address:", p2shAddress);

// generated from bitcoin-cli
const txid = "3c8db9bc0e2f0145b4932e478a1b114b061c6e6142de4311eaea812acc7ca173"
const rawtxn = "02000000000101f67f002430eaee6e4fdcaf8e8bf0c9e2c72ede793c2f45a19adf28eefb8174be0100000017160014d6e002e3fc4f4a57261b1bd6aa79cdb1e024adb7fdffffff02e68a380c010000001976a9145bf7e43b5bf4e27440f0cd858852af1ac0decb1a88ac00c2eb0b000000001976a914bc7462872eb18b0f3ddec2f8c6b043d91e9587ea88ac0247304402204d95969e1d1f3d51a0405300e1ba3ed976bc076fc26dbe3ee79246b37ecd210702207718cec0164bcadfabeaa5670fc2ac60ddf11e59966b5419e524c085ba4ea5f20121032c1d617f8db4b2940123872a7757afc1ba8170133b388e49c194b31aa2db35a300000000"

// Tranasaction construction
const psbt1 = new bitcoin.Psbt({ network });

psbt1.addInput({
  hash: txid,
  index: 1,
  nonWitnessUtxo: Buffer.from(rawtxn, 'hex')
})

// psbt.addInput({
//   hash: txid,
//   index: 0,
//   nonWitnessUtxo: Buffer.from(rawtxn, 'hex'),
//   redeemScript: Buffer.from(redeemScriptHex, 'hex')
// })

psbt1.addOutput({
  address: "2MytaPKkM6FYRt7PgUSSfwvMwYsHrQLbH9W",
  value: 200000000 - 1000000
})
const signinPrivateKey = ECPair.fromWIF('cNDfr3RUdymVEUdrCMuFVK4KH74SP4Mg4xkxkX7aKLDAbkJemHDh', network)
// Sign Transaction
psbt1.signInput(0, signinPrivateKey) // no more error

psbt1.finalizeInput(0)

const tx = psbt1.extractTransaction(true)
const txHex = tx.toHex()

console.log(`Transaction: ${txHex}`)
// txHex: 020000000173a17ccc2a81eaea1143de42616e1c064b111b8a472e93b445012f0ebcb98d3c010000006b48304502210085a71f9efbc0ad0e475a83fdf000e17aaa75564327155b85fb59d9b6a5d4508602203c38be095f6c91ef9fd868582ae4134ae51630b97ba6c9cb75da18e7fcbbd032012103667bdeb04a536bb0290f36d090ccf79dfdf834ddec14c54b4905c32a795eeb43ffffffff01c07fdc0b0000000017a91448e12c0b75db0adcff1a19e90ccaabd589f3a6618700000000

// Replace these with the actual values
const prevTxId = '33804c3a3f422e902ab92a7cb78e5eaef35298cb72f0102610dfea4ed2ef03dd';
// const prevVoutIndex =  1;
const prevRawTxHex = '020000000173a17ccc2a81eaea1143de42616e1c064b111b8a472e93b445012f0ebcb98d3c010000006b48304502210085a71f9efbc0ad0e475a83fdf000e17aaa75564327155b85fb59d9b6a5d4508602203c38be095f6c91ef9fd868582ae4134ae51630b97ba6c9cb75da18e7fcbbd032012103667bdeb04a536bb0290f36d090ccf79dfdf834ddec14c54b4905c32a795eeb43ffffffff01c07fdc0b0000000017a91448e12c0b75db0adcff1a19e90ccaabd589f3a6618700000000';
// const witnessScriptHex = 'unlocking_script_hex';
const destinationAddress = 'mwo4M6cNH2QyhcxXqD1VyQT9UYxVP2meRF';
const amountToSend =  200000; // Amount in satoshis


const keyPair2 = ECPair.makeRandom({ network })
// const privateKeyWIF2 = keyPair2.toWIF()

function p2pkhAddress2() {
  const p2pkhAddress2 = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey, network }).address;
  fs.writeFileSync('keypair2.txt', keyPair2.toWIF())
  console.log(`p2pkh address 2: ${p2pkhAddress2}`)
}
// p2pkhAddress2()
// p2pkhAddress2: n4pxXzXAkgySAWPSctdxZvmBzLHLXKnH37

// Tranasaction2 construction
const spendPsbt = new bitcoin.Psbt({ network });

spendPsbt.addInput({
  hash: prevTxId,
  index: 0,
  nonWitnessUtxo: Buffer.from(prevRawTxHex, 'hex'),
  redeemScript: Buffer.from(redeemScriptHex, 'hex')
})

// Add the output to the PSBT
spendPsbt.addOutput({
  address: destinationAddress,
  value: amountToSend
});

const signinPrivateKey2 = ECPair.fromWIF('cNKkcQ4A5wqjawWhY2ckpcknwVTVjdx6MdBWbzVCU2QBFrNu8KRj', network)
// Sign the spending transaction input
spendPsbt.signInput(0, signinPrivateKey2);

// Finalize the spending transaction
spendPsbt.finalizeAllInputs();

const spendTx = psbt1.extractTransaction(true)
const spendTxHex = spendTx.toHex()