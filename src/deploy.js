const fs = require("fs");
const { Long, bytes, units } = require("@zilliqa-js/util");
const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { getAddressFromPrivateKey } = require("@zilliqa-js/crypto");

const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

async function main() {
  const CHAIN_ID = 333;
  const MSG_VERSION = 1;
  const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
  privkey = "5becb5f463488bb16dd9f31548a2e908d2576f5a17cd8130e2413b4f264caef8";
  zilliqa.wallet.addByPrivateKey(privkey);
  const address = getAddressFromPrivateKey(privkey);
  console.log("Your account address is:");
  console.log(`${address}`);
  const myGasPrice = units.toQa("1000", units.Units.Li); // Gas Price that will be used by all transactions

  console.log("start to deploy zrc2: ");
  const code = fs.readFileSync("../contracts/FungibleToken.scilla").toString();
  console.log("contract code is: ");
  console.log(code);
  const init = [
    // this parameter is mandatory for all init arrays
    {
      vname: "_scilla_version",
      type: "Uint32",
      value: "0"
    },
    {
      vname: "contract_owner",
      type: "ByStr20",
      value: `${address}`
    },
    {
      vname: "name",
      type: "String",
      value: `INRDT`
    },
    {
      vname: "symbol",
      type: "String",
      value: `INRDT`
    },
    {
      vname: "decimals",
      type: "Uint32",
      value: `2`
    },
    {
      vname: "default_operators",
      type: "List ByStr20",
      value: [
        "0xba81FC95Ef1f9F6870A38Ea4331db4bF7dF87a04",
        "0x016D321D6DC66527B3B38A49393583A7408A9625",
        "0x60cE5c16e66b763B292A1915458319061366c4E1"
      ]
    },
    {
      vname: "init_supply",
      type: "Uint128",
      value: `100000000`
    }
  ];
  console.log("init json is: ");
  console.log(JSON.stringify(init));
  const contract = zilliqa.contracts.new(code, init);
  try {
    const [deployTx, ftoken] = await contract.deployWithoutConfirm(
      {
        version: VERSION,
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(40000)
      },
      false
    );

    if (ftoken.error) {
      console.error(ftoken.error);
      return;
    }
    // check the pending status
    const pendingStatus = await zilliqa.blockchain.getPendingTxn(deployTx.id);
    console.log(`Pending status is: `);
    console.log(pendingStatus.result);

    // process confirm
    console.log(`The transaction id is:`, deployTx.id);
    console.log(`Waiting transaction be confirmed`);
    const confirmedTxn = await deployTx.confirm(deployTx.id);

    // Introspect the state of the underlying transaction
    console.log(`Deployment Transaction ID: ${deployTx.id}`);

    // Get the deployed contract address
    console.log("The contract address is:");
    console.log(ftoken.address);
  } catch (e) {
    console.error(e);
  }
}

main();
