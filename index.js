const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1')
const {ECPairFactory} = require('ecpair');
const { regtest, testnet } = require('bitcoinjs-lib/src/networks');


const generateRedeemScript = (str) => {
  // Generate a buffer pre-image
  const preImage = Buffer.from(str, 'utf8');
  
  // hash the pre-image
  const hash = crypto.createHash('sha256').update(preImage).digest();
  
  // generate the redeem script
  const redeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_SHA256,
    "427472757374204275696c64657273", // use the hex instead
    bitcoin.opcodes.OP_EQUAL
  ])
  // console.log(`hash: ${hash.toString('hex')}, redeemScript: ${redeemScript.toString('hex')}`)
  return redeemScript;
}

const generateRedeemScriptHex = (str) => {
  // generate the redeem script
  const redeemScript = generateRedeemScript(str)
  
  // Convert the redeem script to hex
  const redeemScriptHex = redeemScript.toString('hex');
  console.log(`Redeem Script (Hex): ${redeemScriptHex}`);
  
  // // Compute the hash of the redeem script
  // const redeemScriptHash = bitcoin.crypto.hash160(redeemScript);
  // console.log(`Redeem Script (Hash): ${redeemScriptHash}`)
  return redeemScriptHex;
}

const testnetAddress = () => {
  const ECPair = ECPairFactory(ecc)
  const keyPair = ECPair.makeRandom({network: bitcoin.networks.testnet})
  const privateKey = keyPair.privateKey; // Private key in WIF format
  const inputIndex = 0;

  const {address} = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: bitcoin.networks.testnet});
  // console.log(`p2pkh address: ${address}`)
}
// testnetAddress()

generateRedeemScriptHex("Btrust Builders");
const lock_hex = "427472757374204275696c64657273"
console.log(`OP_SHA256 ${lock_hex} OP_EQUAL`)
const redeemScript = bitcoin.script.fromASM(`OP_SHA256 ${lock_hex} OP_EQUAL`)

const getAddress = (str) => {
  const redeemScript = generateRedeemScript(str);
  // convert the hash to a bitcoin address
  const address = bitcoin.payments.p2sh({
    redeem: { output: redeemScript },
    network: bitcoin.networks.regtest // Use the appropriate network
  }).address;
  
  //  console.log(`Address: ${address}`);
  
   return address;
}

// console.log(getAddress("Btrust Builders"));

// Create a new transaction builder
// const txb = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin);

// // Add input (UTXO)
// // Replace with actual UTXO details
// const utxo = {
//  txId: '...', // Transaction ID of the UTXO
//  vout: ..., // Output index of the UTXO
//  value: ..., // Value of the UTXO in satoshis
// };
// txb.addInput(utxo.txId, utxo.vout);

// Create a new transaction builder
const txb = new bitcoin.Psbt({ network: bitcoin.networks.regtest });

async function getTxn(txid) {
  const response = await axios.get(`https://blockstream.info/testnet/api/tx/${txid}/hex`)
  const {data} = await response;
  // console.log(data)
  return data
}

const testnet_txid = '328f481eb1f8c599164c65f4931bb2d002eb03b8084958524b516a6288569d3d'
// const txid = 'd5940f905341eadd698f9d3dda9087270a9138e85da2c6d0496fe0bd7e73ba65' // local version
const nonWitnessUtxo = getTxn(testnet_txid)
.then(rawTx => {
   const result = Buffer.from(rawTx, 'hex')
  //  console.log(result) // print the nonWitnessUtxo value
   return result;
})
.catch(error => {
   console.error(`Failed to get transaction: ${error}`)
})
console.log(nonWitnessUtxo)

const sendBtcToAddress = async () => {
  const result = await nonWitnessUtxo
  const outputNumber = 0;
  const amount = 0.00064161;
  // const destinationAddress = 'mv4rnyY3Su5gjcDNzbMLKBQkBicCtHUtFB';
  const destinationAddress = getAddress("Btrust Builders")
  const minerFee = 10000;
  const outputAmount = amount*1e8 - minerFee;

  const utxo = {
    hash: testnet_txid,
    index: outputNumber,
    nonWitnessUtxo: Buffer.from(result, 'hex'), // replace 'nonWitnessUtxo' with actual value
  };
  txb.addInput(utxo);
  txb.addOutput({
    address: destinationAddress,
    value: outputAmount
  })
  // Sign the transaction
  // Replace with actual private key and input index
  const ECPair = ECPairFactory(ecc)
  const keyPair = ECPair.makeRandom({network: testnet})
  const privateKey = keyPair.privateKey; 
  const inputIndex = 0;

  // const {address} = bitcoin.payments.p2sh({pubkey: keyPair.publicKey, network: bitcoin.networks.testnet});
  // console.log(`p2pkh address: ${address}`)


  // const lock_hex = "427472757374204275696c64657273"
  // // console.log(`OP_SHA256 ${lock_hex} OP_EQUAL`)
  // const redeemScript = bitcoin.script.fromASM(`OP_SHA256 ${lock_hex} OP_EQUAL`)

  // // const scriptPubKey = bitcoin.payments.p2sh({ redeem: {output: redeemScript}, network: bitcoin.networks.regtest});

  // // const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: bitcoin.ECPair.fromPrivateKey(privateKey).publicKey });
  // const scriptPubKey = bitcoin.payments.p2sh({ redeem: {output: generateRedeemScript("Btrust Builders")}, network: bitcoin.networks.regtest});

  // // console.log(scriptPubKey)
  const signature = txb.signInput(0, keyPair);

  
  // txb.finalizeAllInputs()
  
  // // Get the raw transaction in hex format
  // const rawTx = txb.build().toHex();
  // console.log(`Raw Transaction: ${rawTx}`);
}
sendBtcToAddress()


// // Create a new transaction builder
// const txbSpend = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin);

// // Add input (previous transaction output)
// // Replace with actual output details
// const prevTxOutpoint = {
//  txId: '...', // Transaction ID of the previous transaction
//  vout: ..., // Output index of the previous transaction
// };
// txbSpend.addInput(prevTxOutpoint.txId, prevTxOutpoint.vout, null, redeemScript);

// // Add output (destination address and amount)
// // Replace with actual destination address and amount
// const destinationAddressChange = '...';
// const amountChange = ...; // Change amount in satoshis
// txbSpend.addOutput(destinationAddressChange, amountChange);

// // Provide the pre-image as witness
// txbSpend.setWitness(0, [Buffer.from(preImage)]);

// // Get the raw transaction in hex format
// const rawTxSpend = txbSpend.build().toHex();
// console.log(`Raw Spending Transaction: ${rawTxSpend}`);