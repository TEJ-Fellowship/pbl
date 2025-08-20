import "./PendingTxn.css";

const PendingTransactions = ({ pendingTransactions, onMineTransactions }) => {
  return (
    <div className="pendingContainer">
      <div className="pendingHeader">
        <h3 className="pendingTitle">
          Pending Transactions ({pendingTransactions.length})
        </h3>
        <button 
          className="mineButton"
          onClick={onMineTransactions}
          disabled={pendingTransactions.length === 0}
        >
          Mine Pending Transactions
        </button>
      </div>

      {pendingTransactions.length === 0 ? (
        <div className="noPending">
          <p>No pending transactions</p>
          {/* <span className="pendingIcon"></span> */}
        </div>
      ) : (
        <div className="pendingList">
          {pendingTransactions.map((txn, index) => (
            <div key={txn.txn_id || index} className="pendingTransaction">
              <div className="txnHeader">
                <span className="txnId">#{txn.txn_id}</span>
                <span className="txnAmount">{txn.amount} coins</span>
              </div>
              
              <div className="txnFlow">
                <div className="txnParty">
                  <span className="partyLabel">From:</span>
                  <span className="partyAddress">
                    {txn.sender === "SYSTEM" 
                      ? "SYSTEM" 
                      : `👤 ${txn.sender.substring(0, 8)}...`
                    }
                  </span>
                </div>
                
                <div className="arrow">→</div>
                
                <div className="txnParty">
                  <span className="partyLabel">To:</span>
                  <span className="partyAddress">
                    👤 {txn.recipient.substring(0, 8)}...
                  </span>
                </div>
              </div>

              <div className="txnStatus">
                <span className="statusBadge pending">Pending</span>
                {txn.signature && (
                  <span className="signedBadge">✅ Signed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingTransactions;