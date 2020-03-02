import React, { Component } from "react";
import { dapp } from "dapp-wallet-util";
import { BrowserRouter, Route, Link } from "react-router-dom";
import { Contracts } from "@zilliqa-js/contract";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import {
  fromBech32Address,
  toBech32Address,
  getAddressFromPublicKey
} from "@zilliqa-js/crypto";
import { Transaction } from "@zilliqa-js/account";
const { BN, Long, bytes, units } = require("@zilliqa-js/util");

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      random: undefined,
      loadingInstance: true,
      instanceError: false,
      moonlet: undefined,
      zilliqa: undefined,
      accountConnected: false
    };

    this.fetchWalletInstance = this.fetchWalletInstance.bind(this);
    console.log("Im here");
  }

  fetchWalletInstance() {
    console.log("I m here");
    this.setState({ loadingInstance: true, instanceError: false });

    dapp.getWalletInstance("moonlet").then(
      moonlet => {
        // create Zilliqa instance
        const zilliqa = new Zilliqa("", moonlet.providers.zilliqa);

        // apply a hack to disable internal ZilliqaJS autosigning feature
        zilliqa.blockchain.signer = zilliqa.contracts.signer = {
          sign: m => m
        };

        this.setState({ moonlet, zilliqa, loadingInstance: false });
      },
      instanceError => {
        this.setState({ loadingInstance: false, instanceError });
      }
    );
  }
  async onConnectClick() {
    this.state.moonlet.providers.zilliqa.getAccounts().then(accounts => {
      console.log(accounts);
      this.setState({ accountConnected: true });
    });
  }

  renderErrors() {
    console.log(this.state.loadingInstance, this.state.instanceError);
    if (!this.state.loadingInstance && this.state.instanceError) {
      switch (this.state.instanceError) {
        case "WALLET_NOT_INSTALLED":
          // moonlet is not installed, show a relevant message
          return (
            <p>
              It seems you don't have moonlet wallet installed. <br />
              <br />
              <a
                href="https://chrome.google.com/webstore/detail/moonlet-wallet/aepcjklheilpnnokjfpgncfcdakhbgci"
                target="_blank"
              >
                Install Moonlet Wallet
              </a>
            </p>
          );
        case "USER_DID_NOT_GRANT_PERMISSION":
          // the user did not grant permission for Moonlet to inject the content scripts to dApp website
          return (
            <p>
              You did not grant access on this page for Moonlet Wallet. <br />
              <br />
              You have to let Moonlet Wallet to access this page in order to
              continue.
              <br />
              <br />
              <button onClick={this.fetchWalletInstance.bind(this)}>
                Grant permission
              </button>
            </p>
          );
        default:
          // Other error, not quite relevant for now...
          return (
            <p>There was an error while loading moonlet wallet instance.</p>
          );
      }
    }
  }

  render() {
    return (
      <div>
        <h1>My Wallet Example</h1>
        {/* Wallet instance is loading, display loader */}
        {this.state.loadingInstance && <p>Loading wallet instance...</p>}
        {/* Handle errors */}
        {/* Wallet instance loaded, permission was granted, but the user did not connect to an account */}
        {!this.state.loadingInstance &&
          !this.state.instanceError &&
          !this.state.accountConnected && (
            <p>
              <button onClick={this.onConnectClick.bind(this)}>
                Connect with Moonlet
              </button>
            </p>
          )}
        {/* everything is fine, dApp is connected to Moonlet, and it has access to an account  */}
        {this.state.accountConnected && (
          <div>
            {/* Examples of basic operations calls */}
            <button
              onClick={() => {
                this.state.zilliqa.blockchain
                  .getBlockChainInfo()
                  .then(this.genericRPCHandler);
              }}
            >
              Get Blockchain Info
            </button>
            <button
              onClick={() => {
                this.state.zilliqa.blockchain
                  .getShardingStructure()
                  .then(this.genericRPCHandler);
              }}
            >
              Get Sharding Structure
            </button>
            <button
              onClick={() => {
                this.state.zilliqa.blockchain
                  .getLatestDSBlock()
                  .then(this.genericRPCHandler);
              }}
            >
              Get Latest DS Block
            </button>
            <br />
            <br />

            {/* Display current selected account info */}
            <div>
              Connected Account (bech32):{" "}
              {this.state.moonlet.providers.zilliqa.currentAccount.address}
            </div>
            <div>
              Connected Account (old):{" "}
              {fromBech32Address(
                this.state.moonlet.providers.zilliqa.currentAccount.address
              )}
            </div>
            <div>
              Connected Account pubkey:{" "}
              {
                this.state.moonlet.providers.zilliqa.currentAccount.address
                  .pubkey
              }
            </div>
            <div>
              Connected Chain ID:{" "}
              {this.state.moonlet.providers.zilliqa.currentNetwork.chainId}
            </div>
            <div>
              Connected Network name:{" "}
              {this.state.moonlet.providers.zilliqa.currentNetwork.name}
            </div>
            <div>
              Connected Network url:{" "}
              {this.state.moonlet.providers.zilliqa.currentNetwork.url}
            </div>
            <div>
              Connected Network is main net:{" "}
              {this.state.moonlet.providers.zilliqa.currentNetwork.mainNet
                ? "yes"
                : "no"}
            </div>

            {/* trigger to force user to select an account, this could be used to implement a switch account feature */}
            <button
              onClick={() => {
                this.state.moonlet.providers.zilliqa
                  .getAccounts(true)
                  .then(accounts => {
                    this.setState({
                      random: Math.random(),
                      accountConnected: true
                    });
                  });
              }}
            >
              Switch account
            </button>

            {/* Get balance for current account call */}
            {/* Note: for now zilliqa.blockchain.getBalance doesn't support bech32 address format, so the dApp should do this transformation, for now */}
            <button
              onClick={() => {
                this.state.zilliqa.blockchain
                  .getBalance(
                    fromBech32Address(
                      this.state.moonlet.providers.zilliqa.currentAccount
                        .adddress
                    )
                  )
                  .then(this.genericRPCHandler);
              }}
            >
              Get Current Account Balance
            </button>

            <br />
            <br />
            {/* Create transaction example */}
            {/* Note: the fields version, nonce and pubKey are ignored, Moonlet will fill them automatically based on current network and current account */}
            <button
              onClick={async () => {
                const tx = await this.state.zilliqa.blockchain.createTransaction(
                  new Transaction(
                    {
                      toAddr: "zil1arczrdu3e7xvgvqd98rrj9mdfyrysc7eecshc3",
                      amount: new BN(units.toQa("1", units.Units.Zil)),
                      gasPrice: units.toQa("1000", units.Units.Li),
                      gasLimit: Long.fromNumber(1)
                    },
                    this.state.moonlet.providers.zilliqa
                  )
                );

                console.log("Transaction", tx);
              }}
            >
              Do transfer
            </button>

            <br />
            <br />
            {/* Contract interaction example */}
            <button onClick={this.deployContract.bind(this)}>
              Deploy Contract
            </button>

            <br />
            <br />
            {/* Contract interaction example */}
            <button
              onClick={() =>
                this.state.moonlet.providers.zilliqa
                  .signMessage("Aloha!")
                  .then(this.genericRPCHandler)
              }
            >
              Sign Message
            </button>
          </div>
        )}
      </div>
    );
  }
}
export default App;
