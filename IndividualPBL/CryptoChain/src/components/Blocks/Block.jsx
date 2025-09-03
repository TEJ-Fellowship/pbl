import styles from "./Block.module.css";

const Block = ({ block }) => {
  return (
    <div className={styles.blockContainer}>
      <h3 className={styles.blockTitle}>Block #{block.index}</h3>
      
      <div className={styles.blockInfo}>
        <div className={styles.infoRow}>
          <strong>Hash:</strong> 
          <span className={styles.hashText}>{block.hash}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Previous Hash:</strong> 
          <span className={styles.hashText}>{block.prevHash}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Merkle Root:</strong> 
          <span className={styles.hashText}>{block.merkleRoot}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Nonce:</strong> 
          <span>{block.nonce}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Timestamp:</strong> 
          <span>{new Date(block.timestamp * 1000).toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.transactionsSection}>
        <h4 className={styles.transactionTitle}>
          Transactions ({block.transactions.length})
        </h4>
        
        {block.transactions.length === 0 ? (
          <p className={styles.noTransactions}>No transactions in this block</p>
        ) : (
          <div className={styles.transactionsList}>
            {block.transactions.map((txn, index) => (
              <div key={txn.txn_id || index} className={styles.transaction}>
                <div className={styles.txnRow}>
                  <strong>ID:</strong> {txn.txn_id}
                </div>
                <div className={styles.txnRow}>
                  <strong>From:</strong> 
                  <span className={styles.address}>
                    {txn.sender === "SYSTEM" ? "SYSTEM" : `${txn.sender.substring(0,60)}...`}
                  </span>
                </div>
                <div className={styles.txnRow}>
                  <strong>To:</strong> 
                  <span className={styles.address}>
                    {txn.recipient.substring(0,60 )}...
                  </span>
                </div>
                <div className={styles.txnRow}>
                  <strong>Amount:</strong> {txn.amount}
                </div>
                {txn.signature && (
                  <div className={styles.txnRow}>
                    <strong>Signature:</strong> 
                    <span className={styles.signature}>
                      {txn.signature.substring(0, 60)}...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Block;
