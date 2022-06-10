import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { sequence } from "0xsequence";

import { ETHAuth, Proof } from "@0xsequence/ethauth";
import { ERC_20_ABI } from "./constants/abi";
// import { sequenceContext } from '@0xsequence/network'

import { configureLogger } from "@0xsequence/utils";
import { Button } from "./components/Button";
import { styled, typography } from "./style";

import logoUrl from "./images/logo.svg";
import skyweaverBannerUrl from "./images/skyweaver-banner.png";

import { Group } from "./components/Group";
import { OpenWalletIntent, Settings } from "@0xsequence/provider";
import { NetworkConfig } from "0xsequence/dist/declarations/src/network";

configureLogger({ logLevel: "DEBUG" });

const App = () => {
  const network = "polygon";
  const walletAppURL =
    process.env.REACT_APP_WALLET_APP_URL || "https://sequence.app";

  const wallet = new sequence.Wallet(network, { walletAppURL });

  // NOTE: to use mumbai, first go to https://sequence.app and click on "Enable Testnet".
  // As well, make sure to comment out any other `const wallet = ..` statements.
  // const network = 'mumbai'
  // const wallet = new sequence.Wallet(network)

  // Example of changing the walletAppURL
  // const wallet = new sequence.Wallet(network, { walletAppURL: 'https://sequence.app' })

  const [networks, setNetworks] = useState<NetworkConfig[]>([])

  useEffect(() => {
    wallet.getNetworks().then(setNetworks)
  }, [wallet])

  wallet.on("message", (message) => {
    console.log("wallet event (message):", message);
  });

  wallet.on("accountsChanged", (p) => {
    console.log("wallet event (accountsChanged):", p);
  });

  wallet.on("chainChanged", (p) => {
    console.log("wallet event (chainChanged):", p);
  });

  wallet.on("connect", (p) => {
    console.log("wallet event (connect):", p);
  });

  wallet.on("disconnect", (p) => {
    console.log("wallet event (disconnect):", p);
  });

  wallet.on("open", (p) => {
    console.log("wallet event (open):", p);
  });

  wallet.on("close", (p) => {
    console.log("wallet event (close):", p);
  });

  const connect = async (
    authorize: boolean = false,
    withSettings: boolean = false
  ) => {
    const connectDetails = await wallet.connect({
      app: "Demo Dapp",
      authorize,
      // keepWalletOpened: true,
      ...(withSettings && {
        settings: {
          theme: "indigoDark",
          bannerUrl: `${window.location.origin}${skyweaverBannerUrl}`,
          includedPaymentProviders: ["moonpay"],
          defaultFundingCurrency: "matic",
        },
      }),
    });

    console.warn("connectDetails", { connectDetails });

    if (authorize) {
      const ethAuth = new ETHAuth();

      if (connectDetails.proof) {
        const decodedProof = await ethAuth.decodeProof(
          connectDetails.proof.proofString,
          true
        );

        console.warn({ decodedProof });

        const isValid = await wallet.utils.isValidTypedDataSignature(
          await wallet.getAddress(),
          connectDetails.proof.typedData,
          decodedProof.signature,
          1
        );
        console.log("isValid?", isValid);
        if (!isValid) throw new Error("sig invalid");
      }
    }
  };

  const disconnect = () => {
    wallet.disconnect();
  };

  const openWallet = () => {
    wallet.openWallet();
  };

  const openWalletWithSettings = () => {
    const settings: Settings = {
      theme: "goldDark",
      includedPaymentProviders: ["moonpay", "ramp"],
      defaultFundingCurrency: "eth",
      lockFundingCurrencyToDefault: false,
    };
    const intent: OpenWalletIntent = {
      type: "openWithOptions",
      options: {
        settings,
      },
    };
    const path = "wallet/add-funds";
    wallet.openWallet(path, intent);
  };

  const closeWallet = () => {
    wallet.closeWallet();
  };

  const isConnected = async () => {
    console.log("isConnected?", wallet.isConnected());
  };

  const isOpened = async () => {
    console.log("isOpened?", wallet.isOpened());
  };

  const getDefaultChainID = async () => {
    console.log("TODO");
  };;

  const getChainID = async () => {
    console.log("chainId:", await wallet.getChainId());

    const provider = wallet.getProvider();
    console.log("provider.getChainId()", await provider!.getChainId());

    const signer = wallet.getSigner();
    console.log("signer.getChainId()", await signer.getChainId());
  };

  const getAccounts = async () => {
    console.log("getAddress():", await wallet.getAddress());

    const provider = wallet.getProvider();
    console.log("accounts:", await provider!.listAccounts());
  };

  const getBalance = async () => {
    const provider = wallet.getProvider();
    const account = await wallet.getAddress();
    const balanceChk1 = await provider!.getBalance(account);
    console.log("balance check 1", balanceChk1.toString());

    const signer = wallet.getSigner();
    const balanceChk2 = await signer.getBalance();
    console.log("balance check 2", balanceChk2.toString());
  };

  const getWalletState = async () => {
    console.log("wallet state:", await wallet.getSigner().getWalletState());
  };

  const getNetworks = async () => {
    console.log("networks:", await wallet.getNetworks());
  };

  const signMessage = async (network: NetworkConfig, counterfactual?: boolean) => {
    console.log("signing message...");
    const signer = wallet.getSigner();

    const message = `Two roads diverged in a yellow wood,
Robert Frost poet

And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`;

    // sign
    const sig = await signer.signMessage(message, network, undefined, counterfactual);
    console.log("signature:", sig);

    // validate
    const isValidHex = await wallet.utils.isValidMessageSignature(
      await wallet.getAddress(),
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
      sig,
      network.chainId
    );
    console.log("isValidHex?", isValidHex);

    const isValid = await wallet.utils.isValidMessageSignature(
      await wallet.getAddress(),
      message,
      sig,
      network.chainId
    );
    console.log("isValid?", isValid);
    if (!isValid) throw new Error("sig invalid");

    // recover
    // const walletConfig = await wallet.utils.recoverWalletConfigFromMessage(
    //   await wallet.getAddress(),
    //   message,
    //   sig,
    //   await signer.getChainId(),
    //   sequenceContext
    // )
    // console.log('recovered walletConfig:', walletConfig)
    // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    // if (!match) throw new Error('recovery address does not match')
    // console.log('address match?', match)
  };


  const signTypedData = async (network: NetworkConfig, counterfactual?: boolean) => {
    console.log("signing typedData...");

    const typedData: sequence.utils.TypedData = {
      domain: {
        name: "Ether Mail",
        version: "1",
        chainId: await wallet.getChainId(),
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      },
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
      },
      message: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
    };

    const signer = wallet.getSigner();

    const sig = await signer.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      network,
      undefined,
      counterfactual
    );
    console.log("signature:", sig);

    // validate
    const isValid = await wallet.utils.isValidTypedDataSignature(
      await wallet.getAddress(),
      typedData,
      sig,
      network.chainId
    );
    console.log("isValid?", isValid);
    if (!isValid) throw new Error("sig invalid");

    // recover
    // const walletConfig = await wallet.utils.recoverWalletConfigFromTypedData(
    //   await wallet.getAddress(),
    //   typedData,
    //   sig,
    //   await signer.getChainId()
    // )
    // console.log('recovered walletConfig:', walletConfig)

    // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    // if (!match) throw new Error('recovery address does not match')
    // console.log('address match?', match)
  };

  const signETHAuth = async (counterfactual?: boolean) => {
    const address = await wallet.getAddress();

    const authSigner = await wallet.getSigner(137)
    console.log("AUTH CHAINID..", await authSigner.getChainId());
    const authChainId = await authSigner.getChainId();

    const proof = new Proof();
    proof.address = address;
    proof.claims.app = "wee";
    proof.claims.ogn = "http://localhost:4000";
    proof.setIssuedAtNow();
    proof.setExpiryIn(1000000);

    const messageTypedData = proof.messageTypedData();

    const digest = sequence.utils.encodeTypedDataDigest(messageTypedData);
    console.log("we expect digest:", digest);

    const sig = await authSigner.signTypedData(
      messageTypedData.domain,
      messageTypedData.types,
      messageTypedData.message,
      undefined,
      undefined,
      counterfactual
    );
    console.log("signature:", sig);

    // validate
    const isValid = await wallet.utils.isValidTypedDataSignature(
      await wallet.getAddress(),
      messageTypedData,
      sig,
      authChainId
    );
    console.log("isValid?", isValid);
    if (!isValid) throw new Error("sig invalid");

    // recover
    // TODO/NOTE: in order to recover this, the wallet needs to be updated on-chain,
    // or we need the init config.. check if its deployed and updated
    // const walletConfig = await wallet.utils.recoverWalletConfigFromTypedData(
    //   await wallet.getAddress(),
    //   messageTypedData,
    //   sig,
    //   authChainId
    // )

    // console.log('recovered walletConfig:', walletConfig)
    // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    // // if (!match) throw new Error('recovery address does not match')
    // console.log('address match?', match)
  };

  const estimateUnwrapGas = async () => {
    const wmaticContractAddress = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    const wmaticInterface = new ethers.utils.Interface([
      "function withdraw(uint256 amount)",
    ]);

    const tx: sequence.transactions.Transaction = {
      to: wmaticContractAddress,
      data: wmaticInterface.encodeFunctionData("withdraw", [
        "1000000000000000000",
      ]),
    };

    const provider = wallet.getProvider()!;
    const estimate = await provider.estimateGas(tx);

    console.log(
      "estimated gas needed for wmatic withdrawal:",
      estimate.toString()
    );
  };

  const sendETH = async (signer?: sequence.provider.Web3Signer) => {
    signer = signer || wallet.getSigner(); // select DefaultChain signer by default

    console.log(`Transfer txn on ${signer.getChainId()} chainId`);

    // NOTE: on mainnet, the balance will be of ETH value
    // and on matic, the balance will be of MATIC value
    // const balance = await signer.getBalance()
    // if (balance.eq(ethers.constants.Zero)) {
    //   const address = await signer.getAddress()
    //   throw new Error(`wallet ${address} has 0 balance, so cannot transfer anything. Deposit and try again.`)
    // }

    const toAddress = ethers.Wallet.createRandom().address;

    const tx1: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: "0x55555",
      to: toAddress,
      value: ethers.utils.parseEther("1.234"),
      data: "0x",
    };

    const tx2: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: "0x55555",
      to: toAddress,
      value: ethers.utils.parseEther("0.4242"),
      data: "0x",
    };

    const provider = signer.provider;

    console.log(
      `balance of ${toAddress}, before:`,
      await provider.getBalance(toAddress)
    );

    const txnResp = await signer.sendTransactionBatch([tx1, tx2]);
    // await txnResp.wait(); // optional as sendTransactionBatch already waits for the receipt
    console.log("txnResponse:", txnResp);

    console.log(
      `balance of ${toAddress}, after:`,
      await provider.getBalance(toAddress)
    );
  };

  const sendDAI = async (signer?: sequence.provider.Web3Signer) => {
    signer = signer || wallet.getSigner(); // select DefaultChain signer by default

    const toAddress = ethers.Wallet.createRandom().address;

    const amount = ethers.utils.parseUnits("5", 18);

    const daiContractAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"; // (DAI address on Polygon)

    const tx: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: "0x55555",
      to: daiContractAddress,
      value: 0,
      data: new ethers.utils.Interface(ERC_20_ABI).encodeFunctionData(
        "transfer",
        [toAddress, amount.toHexString()]
      ),
    };

    const txnResp = await signer.sendTransactionBatch([tx]);
    // await txnResp.wait(); // optional as sendTransactionBatch already waits for the receipt
    console.log("txnResponse:", txnResp);
  };

  const sendETHSidechain = async (network: NetworkConfig) => {
    // const signer = wallet.getSigner(137)
    // Select network that isn't the DefaultChain..
    const networks = await wallet.getNetworks();
    const n = networks.find((n) => network.chainId === n.chainId);
    sendETH(wallet.getSigner(n));
  };

  const send1155Tokens = async () => {
    console.log("TODO");
  };

  const contractExample = async (signer?: sequence.provider.Web3Signer) => {
    signer = signer || wallet.getSigner();

    const abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",

      "function transfer(address to, uint amount) returns (bool)",

      "event Transfer(address indexed from, address indexed to, uint amount)",
    ];

    // USD Coin (PoS) on Polygon
    const address = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

    const usdc = new ethers.Contract(address, abi, signer);

    console.log("Token symbol:", await usdc.symbol());
  };

  // const sendBatchTransaction = async () => {
  //   console.log('TODO')
  // }

  return (
    <Container>
      <SequenceLogo alt="logo" src={logoUrl} />

      <Title>
        Demo Dapp ({network && network.length > 0 ? network : "mainnet"})
      </Title>
      <Description>
        Please open your browser dev inspector to view output of functions below
      </Description>

      <Group label="Connection" layout="grid">
        <Button onClick={() => connect()}>Connect</Button>
        <Button onClick={() => connect(true)}>Connect & Auth</Button>
        <Button onClick={() => connect(true, true)}>
          Connect with Settings
        </Button>
        <Button onClick={() => disconnect()}>Disconnect</Button>
        <Button onClick={() => openWallet()}>Open Wallet</Button>
        <Button onClick={() => openWalletWithSettings()}>
          Open Wallet with Settings
        </Button>
        <Button onClick={() => closeWallet()}>Close Wallet</Button>
        <Button onClick={() => isConnected()}>Is Connected?</Button>
        <Button onClick={() => isOpened()}>Is Opened?</Button>
        <Button onClick={() => getDefaultChainID()}>DefaultChain?</Button>
      </Group>

      <Group label="State" layout="grid">
        <Button onClick={() => getChainID()}>ChainID</Button>
        <Button onClick={() => getNetworks()}>Networks</Button>
        <Button onClick={() => getAccounts()}>Get Accounts</Button>
        <Button onClick={() => getBalance()}>Get Balance</Button>
        <Button onClick={() => getWalletState()}>Get Wallet State</Button>
      </Group>

      <Group label="Signing" layout="grid">
        {networks && networks.map((n) => <Button onClick={() => signMessage(n)}>Sign message on {n.name}</Button>)}
        {networks && networks.map((n) => <Button onClick={() => signTypedData(n)}>Sign TypedData on {n.name}</Button>)}

        <Button onClick={() => signETHAuth()}>Sign ETHAuth</Button>
      </Group>

      <Group label="Signing counterfactually" layout="grid">
        {networks && networks.map((n) => <Button onClick={() => signMessage(n, true)}>Sign message on {n.name}</Button>)}
        {networks && networks.map((n) => <Button onClick={() => signTypedData(n, true)}>Sign TypedData on {n.name}</Button>)}

        <Button onClick={() => signETHAuth(true)}>Sign ETHAuth</Button>
      </Group>

      <Group label="Simulation" layout="grid">
        <Button onClick={() => estimateUnwrapGas()}>Estimate Unwrap Gas</Button>
      </Group>

      <Group label="Transactions" layout="grid">
        <Button onClick={() => sendETH()}>Send on DefaultChain</Button>
        {networks && networks.map((n) => <Button onClick={() => sendETHSidechain(n)}>Send on {n.name}</Button>)}
        <Button onClick={() => sendDAI()}>Send DAI</Button>
        <Button onClick={() => send1155Tokens()}>Send ERC-1155 Tokens</Button>
        {/* <Button onClick={() => sendBatchTransaction()}>Send Batch Txns</Button> */}
      </Group>

      <Group label="Various" layout="grid">
        <Button css={{ height: "60px" }} onClick={() => contractExample()}>
          Contract Example (read token symbol)
        </Button>
      </Group>
    </Container>
  );
};

const Container = styled("div", {
  padding: "80px 25px 80px",
  margin: "0 auto",
  maxWidth: "720px",
});

const SequenceLogo = styled("img", {
  height: "40px",
});

const Title = styled("h1", typography.h1, {
  color: "$textPrimary",
  fontSize: "25px",
});

const Description = styled("p", typography.b1, {
  color: "$textSecondary",
  marginBottom: "15px",
});

// SequenceLogo.defaultProps = logoUrl

// const erc1155Abi = [
//   {
//     inputs: [
//       {
//         internalType: 'address',
//         name: '_from',
//         type: 'address'
//       },
//       {
//         internalType: 'address',
//         name: '_to',
//         type: 'address'
//       },
//       {
//         internalType: 'uint256',
//         name: '_id',
//         type: 'uint256'
//       },
//       {
//         internalType: 'uint256',
//         name: '_amount',
//         type: 'uint256'
//       },
//       {
//         internalType: 'bytes',
//         name: '_data',
//         type: 'bytes'
//       }
//     ],
//     name: 'safeTransferFrom',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function'
//   },
//   {
//     inputs: [
//       {
//         internalType: 'address',
//         name: '_owner',
//         type: 'address'
//       },
//       {
//         internalType: 'uint256',
//         name: '_id',
//         type: 'uint256'
//       }
//     ],
//     name: 'balanceOf',
//     outputs: [
//       {
//         internalType: 'uint256',
//         name: '',
//         type: 'uint256'
//       }
//     ],
//     stateMutability: 'view',
//     type: 'function'
//   }
// ]

export default React.memo(App);
