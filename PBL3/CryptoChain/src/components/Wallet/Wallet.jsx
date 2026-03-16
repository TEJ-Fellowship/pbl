

import { useState } from "react";
import styles from "./Wallet.module.css";
import { Transaction } from "../../lib/Blockchain";

const Wallet = ({ wallet, wallets, onSendTransaction }) => {
  const [transactionPopup, setTransactionPopup] = useState(false);
  const [transaction, setTransaction] = useState({
    fromWallet: "",
    toWallet: "",
    amount: "", // ✅ Use 'amount' consistently
  });

  const handleSendTxn = () => {
    const { fromWallet, toWallet, amount } = transaction;
    const amt = parseFloat(amount);

    if (!fromWallet || !toWallet || amt <= 0) {
      alert("Please fill all fields correctly");
      return;
    }

    if (fromWallet === toWallet) {
      alert("Cannot send to the same wallet");
      return;
    }

    const sender = wallets.find((w) => w.id === fromWallet);

    if (sender.balance < amt) {
      alert("No Funds!!");
      return;
    }
    
    onSendTransaction(fromWallet, toWallet, amt);

    setTransaction({ fromWallet: "", toWallet: "", amount: "" });
    setTransactionPopup(false);
  };

  return (
    <>
      <div className={styles.walletContainer}>
        <h3 style={{ color: "white" }}>{wallet.name}</h3>
        <div className={styles.amountBlock}>
          <h4 className={styles.walletAmt}>Wallet Amount:</h4>
          <span className={styles.amt}>{wallet.balance}</span>
        </div>
        <button
          className={styles.sendBtn}
          onClick={() => setTransactionPopup(true)}
        >
          Send
        </button>
        <div
          style={{
            width: "100%",
            height: "0.8px",
            backgroundColor: "grey",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        ></div>
        <p className={styles.walletAdd}>{`Wallet Address: ${wallet.publicKey.substring(0, 30)}...`}</p>
      </div>

      {transactionPopup && (
        <>
          <div
            className={styles.transactionPopupOverlay}
            onClick={() => setTransactionPopup(false)}
          />
          <div className={styles.transactionContainer}>
            <h1 className={styles.transactionTitle}>Create New Transaction</h1>
            <div className={styles.transaction}>
              <label>From Wallet</label>
              <select
                name="wallet"
                className={styles.selectWallet}
                value={transaction.fromWallet}
                onChange={(e) =>
                  setTransaction({ ...transaction, fromWallet: e.target.value })
                }
              >
                <option value="">Select Wallet</option>
                {wallets.map((wallet) => (
                  <option
                    key={wallet.id}
                    value={wallet.id}
                  >{`${wallet.name} (${wallet.balance} coin)`}</option>
                ))}
              </select>

              <label>To Wallet</label>
              <select
                name="wallet"
                className={styles.selectWallet}
                value={transaction.toWallet}
                onChange={(e) =>
                  setTransaction({ ...transaction, toWallet: e.target.value })
                }
              >
                <option value="">Select Wallet</option>
                {wallets.map((wallet) => (
                  <option
                    key={wallet.id}
                    value={wallet.id}
                  >{`${wallet.name} (${wallet.balance} coin)`}</option>
                ))}
              </select>
              
              <label>Amount</label>
              <input
                type="number"
                placeholder="Amount"
                value={transaction.amount} // ✅ Fixed: use 'amount' not 'balance'
                onChange={(e) =>
                  setTransaction({ ...transaction, amount: e.target.value })
                }
              />
              
              <div className={styles.txnBtn}>
                <button className={styles.sendBtn} onClick={handleSendTxn}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Wallet;
