import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

const convertToPeso = async (ethAmount) => {
  const apiKey = 'YOUR_API_KEY';
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=php&apiKey=${apiKey}`);
  const data = await response.json();
  const exchangeRate = data.ethereum.php;
  const pesoAmount = ethAmount * exchangeRate;
  return pesoAmount.toFixed(2);
};

const HomePage = () => {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactions, setTransactions] = useState([]);
  const [pesoBalance, setPesoBalance] = useState(undefined);
  const [inputAmount, setInputAmount] = useState("");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const ethBalance = (await atm.getBalance()).toNumber();
      setBalance(ethBalance);
      const pesoAmount = await convertToPeso(ethBalance);
      setPesoBalance(pesoAmount);
    }
  };

  const deposit = async () => {
    if (atm && inputAmount > 0) {
      let tx = await atm.deposit(inputAmount);
      await tx.wait();
      getBalance();
      addTransaction("Deposit", inputAmount);
      setInputAmount("");
    }
  };

  const withdraw = async () => {
    if (atm && inputAmount > 0) {
      let tx = await atm.withdraw(inputAmount);
      await tx.wait();
      getBalance();
      addTransaction("Withdraw", -inputAmount);
      setInputAmount("");
    }
  };

  const burnTokens = async () => {
    if (atm && inputAmount > 0) {
      try {
        let tx = await atm.burn(inputAmount);
        await tx.wait();
        getBalance();
        addTransaction("Burn", -inputAmount);
        setInputAmount("");
      } catch (error) {
        console.error("Error burning tokens:", error);
        // Handle error
      }
    }
  };

  const loan = async () => {
    if (atm) {
      try {
        let tx = await atm.loan(); // Call the loan function
        await tx.wait();
        getBalance();
        addTransaction("Loan", 0.01); // Assuming 1% of the balance is loaned
      } catch (error) {
        console.error("Error loaning:", error);
        // Handle error
      }
    }
  };

  const applyTax = async () => {
    if (atm) {
      try {
        let tx = await atm.applyTax(); // Call the applyTax function
        await tx.wait();
        getBalance();
        addTransaction("Tax", -balance * 0.05); // Assuming 5% tax on the balance
      } catch (error) {
        console.error("Error applying tax:", error);
        // Handle error
      }
    }
  };

  const addTransaction = (type, amount) => {
    const newTransaction = { type, amount, timestamp: new Date().toLocaleString() };
    setTransactions([newTransaction, ...transactions]);
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount} className="connect-btn">Connect Metamask Wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div className="user-details">
        <p className="account">Your Account: {account}</p>
        <p className="balance">Your Balance: {balance} ETH ({pesoBalance} PHP)</p>
        <div className="transaction-btns">
          <input 
            type="number" 
            value={inputAmount} 
            onChange={(e) => setInputAmount(e.target.value)} 
            placeholder="Enter amount"
            className="amount-input"
          />
          <button onClick={deposit} className="deposit-btn">Deposit</button>
          <button onClick={withdraw} className="withdraw-btn">Withdraw</button>
          <button onClick={burnTokens} className="burn-btn">Burn</button>
          <button onClick={loan} className="loan-btn">Loan 1% of Balance</button>
          <button onClick={applyTax} className="tax-btn">Apply Tax</button> {/* Button for applying tax */}
        </div>
        <h2>Transaction History</h2>
        <ul className="transaction-list">
          {transactions.map((transaction, index) => (
            <li key={index} className="transaction-item">
              <span className="timestamp">{transaction.timestamp}</span>: {transaction.type} {Math.abs(transaction.amount)} ETH
            </li>
          ))}
        </ul>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <div className="full-screen">
      <main className="container">
        <header>
          <h1>Welcome to My Bank Account!</h1>
        </header>
        {initUser()}
      </main>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: black;
        }
        .full-screen {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          text-align: center;
          color: white;
          font-family: Cambria, serif;
          padding: 20
          px;
        }
        .connect-btn, .deposit-btn, .withdraw-btn, .burn-btn, .loan-btn, .tax-btn {
          background-color: #ffc107;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-family: Cambria, serif;
          font-size: 16px;
          margin: 0 10 px;
        }
        .connect-btn:hover, .deposit-btn:hover, .withdraw-btn:hover, .burn-btn:hover, .loan-btn:hover, .tax-btn:hover {
          background-color: #ffa000;
        }
        .user-details {
          margin-top: 20px;
        }
        .account {
          font-size: 18px;
          color: #fff;
          margin-bottom: 10px;
        }
        .balance {
          font-size: 16px;
          color: #fff;
          margin-bottom: 20px;
        }
        .transaction-btns {
          margin-top: 20px;
        }
        .transaction-list {
          list-style-type: none;
          padding: 0;
          text-align: center;
          margin-top: 20px;
        }
        .transaction-item {
          margin-top: 10px;
          font-size: 14px;
          color: #ccc;
        }
        .timestamp {
          color: #888;
          margin-right: 5px;
        }
        .amount-input {
          margin-right: 10px;
          padding: 5px;
          border-radius: 5px;
          border: 1px solid #ccc;
          font-size: 14px;
          width: 100px;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
