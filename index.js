const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1')
const {ECPairFactory} = require('ecpair')


const generateRedeemScript = (str) => {
  // Generate a buffer pre-image
  const preImage = Buffer.from(str, 'utf8');
  
  // hash the pre-image
  const hash = crypto.createHash('sha256').update(preImage).digest();
  
  // generate the redeem script
  const redeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_SHA256,
    hash,
    bitcoin.opcodes.OP_EQUAL
  ])

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
}

generateRedeemScriptHex("Btrust Builders");

const getAddress = (str) => {
  const redeemScript = generateRedeemScript(str);
  // convert the hash to a bitcoin address
  const address = bitcoin.payments.p2sh({
    redeem: { output: redeemScript },
    network: bitcoin.networks.regtest // Use the appropriate network
  }).address;
  
   console.log(`Address: ${address}`);
  
   return address;
}

getAddress("Btrust Builders");

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

const txid = 'c09fee606fa5209d7cb0aac9f7628f6c413d0e2d330496077de0dc393e4220f2'
const nonWitnessUtxo = getTxn(txid)
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
  const amount = 0.00086528;
  // const destinationAddress = 'mv4rnyY3Su5gjcDNzbMLKBQkBicCtHUtFB';
  const destinationAddress = getAddress("Btrust Builders")
  const minerFee = 10000;
  const outputAmount = amount*1e8 - minerFee;

  const utxo = {
    hash: txid,
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
  const keyPair = ECPair.makeRandom()
  const privateKey = keyPair.privateKey; // Private key in WIF format
  const inputIndex = 0;
  // const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: bitcoin.ECPair.fromPrivateKey(privateKey).publicKey });
  const p2sh = bitcoin.payments.p2sh({ redeem: {output: generateRedeemScript("Btrust Builders")}, network: bitcoin.networks.regtest});
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