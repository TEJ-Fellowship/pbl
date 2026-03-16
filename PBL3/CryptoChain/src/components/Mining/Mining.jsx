import { useState } from "react";
import { Block } from "../../lib/Blockchain";
import "./Mining.css";

const MiningStatus = ({
  blockchain,
  onMineComplete,
  isVisible = false,
}) => {
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [currentNonce, setCurrentNonce] = useState(0);
  const [hashRate, setHashRate] = useState(0);

  const simulateMining = async () => {
    if (blockchain.pendingTransaction.length === 0) {
      alert("No pending transactions to mine!");
      return;
    }

    setIsMining(true);
    setMiningProgress(0);
    setCurrentNonce(0);

    const startTime = Date.now();
    const totalHashes = 100000; // for progress estimation

    let _lastNonce = 0;

    // ✅ Real-time callback to receive nonce updates from proofOfWork
    const updateNonce = (nonce) => {
      _lastNonce = nonce;
      setCurrentNonce(nonce);
      // approximate progress (optional)
      setMiningProgress(Math.min((nonce / totalHashes) * 100, 95));
      const elapsed = (Date.now() - startTime) / 1000;
      setHashRate(Math.floor(nonce / elapsed));
    };

    try {
      // ✅ Call blockchain.mine() with our callback for real-time updates
      await new Promise((resolve) => {
        setTimeout(() => {
          let block = blockchain.mine(updateNonce); // Pass callback to get real nonce <updates />
          setCurrentNonce(block.nonce)
          setMiningProgress(100);
          resolve();
        }, 50);
      });

      setTimeout(() => {
        setIsMining(false);
        onMineComplete();
      }, 500);
    } catch (error) {
      setIsMining(false);
      alert(`Mining failed: ${error.message}`);
    }
  };



  if (!isVisible && !isMining) return null;

  return (
    <div className="miningContainer">
      <div className="miningHeader">
        <h3 className="miningTitle">
          {isMining ? "Mining in Progress..." : "Mining Status"}
        </h3>
      </div>

      <div className="miningStats">
        <div className="statCard">
          <span className="statLabel">Pending Transactions</span>
          <span className="statValue">
            {blockchain.pendingTransaction.length}
          </span>
        </div>

        <div className="statCard">
          <span className="statLabel">Difficulty</span>
          <span className="statValue">{blockchain.difficulty}</span>
        </div>

        <div className="statCard">
          <span className="statLabel">Current Block</span>
          <span className="statValue">#{blockchain.chain.length}</span>
        </div>

        <div className="statCard">
          <span className="statLabel">Hash Rate</span>
          <span className="statValue">{hashRate.toLocaleString()} H/s</span>
        </div>
      </div>

      {isMining && (
        <div className="miningProgress">
          <div className="progressInfo">
            <span>Finding valid hash...</span>
            <span>{miningProgress.toFixed(1)}%</span>
          </div>
          <div className="progressBar">
            <div
              className="progressFill"
              style={{ width: `${miningProgress}%` }}
            ></div>
          </div>
          <div className="nonceInfo">
            <span>Current Nonce: {currentNonce}</span>
            <span className="hashingAnimation">Hashing...</span>
          </div>
        </div>
      )}

      <div className="miningActions">
        <button
          className="startMiningButton"
          onClick={simulateMining}
          disabled={isMining || blockchain.pendingTransaction.length === 0}
        >
          {isMining ? "Mining..." : "Start Mining"}
        </button>

        <div className="miningInfo">
          <p>
            Mining will process all pending transactions and create a new block.
            The proof-of-work algorithm requires finding a hash that starts with{" "}
            {blockchain.difficulty} zeros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiningStatus;
