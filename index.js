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
console.log(`privateKey: ${keyPair.privateKey}`)
console.log(`privateKeyPairWIF: ${privateKeyWIF}`)

// const preImage = "Btrust Builders";
// const preImage = "427472757374204275696c64657273"
// const lockHash = SHA256(preImage).toString();
// const redeemScript = bitcoin.script.compile([Buffer.from(lockHash, 'hex'), bitcoin.opcodes.OP_EQUAL]);
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
// p2pkhAddress() //to be run just once to create and save the address and the private key WIF


const p2shAddress = bitcoin.payments.p2sh({
  redeem: { output: redeemScript, network },
  network: bitcoin.networks.regtest
}).address;
console.log("P2SH address:", p2shAddress);

// generated from bitcoin-cli
// const p2shtxid = "be7481fbee28df9aa1452f3c79de2ec7e2c9f08b8eafdc4f6eeeea3024007ff6"
const txid = "3c8db9bc0e2f0145b4932e478a1b114b061c6e6142de4311eaea812acc7ca173"
// const rawtxn = "02000000013900b601bb00ad867af8dac2ecdf7110b820dc2c2bde936183e4d055ac005a8c000000006a473044022060817f2017a1be4f23a16a9812f70115d655004730d7357545d6a2fda6beb13702202c4448a628b69e31a83ebd6660edb44031a08171ab5f1516347519a02402f7ae012103c61606ed86c093ce45e5f7c883a815a37cbc25a2bcd80060238fbc193c86e65afdffffff0200c2eb0b0000000017a914774320095839e9cb946877584909cd775bbeafb087904d24180100000017a914c276ffa35770989624d95dfca54d1e81b766c9078770000000"
const rawtxn = "02000000000101f67f002430eaee6e4fdcaf8e8bf0c9e2c72ede793c2f45a19adf28eefb8174be0100000017160014d6e002e3fc4f4a57261b1bd6aa79cdb1e024adb7fdffffff02e68a380c010000001976a9145bf7e43b5bf4e27440f0cd858852af1ac0decb1a88ac00c2eb0b000000001976a914bc7462872eb18b0f3ddec2f8c6b043d91e9587ea88ac0247304402204d95969e1d1f3d51a0405300e1ba3ed976bc076fc26dbe3ee79246b37ecd210702207718cec0164bcadfabeaa5670fc2ac60ddf11e59966b5419e524c085ba4ea5f20121032c1d617f8db4b2940123872a7757afc1ba8170133b388e49c194b31aa2db35a300000000"
const scriptPubKey = "a914c276ffa35770989624d95dfca54d1e81b766c90787"

// Tranasaction construction
const psbt1 = new bitcoin.Psbt({ network });

psbt1.addInput({
  hash: txid,
  index: 1,
  nonWitnessUtxo: Buffer.from(rawtxn, 'hex')
})

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
