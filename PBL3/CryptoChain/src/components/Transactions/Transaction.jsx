import styles from "./Transaction.module.css";

const Transaction = () => {
  return (
    <>
      <div className={styles.transactionContainer}>
        <h1 className={styles.transactionTitle}>Create New Transaction</h1>
        <div className={styles.transaction}>
          <label>From Wallet</label>
          <select name="wallet" className={styles.selectWallet}>
            <option value="">Select Wallet</option>
          </select>
          <label>To Wallet</label>
          <select name="wallet" className={styles.selectWallet}>
            <option value="">Select Wallet</option>
          </select>
          <label>Amount</label>
          <input type="number" placeholder="Amount" />
          <div className={styles.txnBtn}>
            <button className={styles.closeBtn}>Close</button>
            <button className={styles.closeBtn}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transaction;
