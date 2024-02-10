const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1')
const {ECPairFactory} = require('ecpair');
const {SHA256} = require('crypto-js');


const network = bitcoin.networks.regtest;
const ECPair = ECPairFactory(ecc)
const keyPair = ECPair.makeRandom({network})
const privateKeyWIF = keyPair.toWIF()
// console.log(`privateKeyPairWIF: ${privateKeyWIF}`)

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

const p2shAddress = bitcoin.payments.p2sh({
  redeem: { output: redeemScript, network },
  network: bitcoin.networks.regtest
}).address;
console.log("P2SH address:", p2shAddress);

// generated from bitcoin-cli
const p2shtxid = "be7481fbee28df9aa1452f3c79de2ec7e2c9f08b8eafdc4f6eeeea3024007ff6"
const rawtxn = "02000000013900b601bb00ad867af8dac2ecdf7110b820dc2c2bde936183e4d055ac005a8c000000006a473044022060817f2017a1be4f23a16a9812f70115d655004730d7357545d6a2fda6beb13702202c4448a628b69e31a83ebd6660edb44031a08171ab5f1516347519a02402f7ae012103c61606ed86c093ce45e5f7c883a815a37cbc25a2bcd80060238fbc193c86e65afdffffff0200c2eb0b0000000017a914774320095839e9cb946877584909cd775bbeafb087904d24180100000017a914c276ffa35770989624d95dfca54d1e81b766c9078770000000"
const scriptPubKey = "a914c276ffa35770989624d95dfca54d1e81b766c90787"

// Tranasaction construction
const psbt = new bitcoin.Psbt({ network });

psbt.addInput({
  hash: p2shtxid,
  index: 1,
  nonWitnessUtxo: Buffer.from(rawtxn, 'hex'),
  redeemScript: Buffer.from("0014d6e002e3fc4f4a57261b1bd6aa79cdb1e024adb7", 'hex')
})

psbt.addOutput({
  address: "2MsyiBT4t8fK4VCH9G6E8VqHcLyHexUjGWp",
  value: 1000000
})

// Sign Transaction
psbt.signInput(0, keyPair) // causes the error