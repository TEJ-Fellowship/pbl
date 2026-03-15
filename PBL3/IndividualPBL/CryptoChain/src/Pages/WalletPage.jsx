// import Block from "../components/Blocks/Block";
// import Wallet from "../components/Wallet/Wallet";
// import { Blockchain } from "../lib/Blockchain";
// import styles from "./WalletPage.module.css";

// import { useEffect, useState } from "react";

// const WalletPage = () => {
//   const [blockchainState] = useState(() => new Blockchain());

//   const [wallets, setWallets] = useState([]);
//   const [walletPopupOpen, setWalletPopupOpen] = useState(false);
//   const [walletName, setWalletName] = useState("");
//   const [walletAmt, setWalletAmt] = useState("");

//   const [blocks, setBlocks] = useState([]);

//   // const [blockData, setBlockData] = useState({
//   //   hash: "",
//   //   previousHash: "",
//   //   markelRoot: "",
//   //   nonce: "",
//   //   transactions: "",
//   // });

//   useEffect(() => {
//     setBlocks([...blockchainState.chain]);
//   }, [blockchainState]);

//   const handleCreateBtn = async () => {
//     if (!walletName || !walletAmt) return;

//     // Create wallet in blockchain
//     const newWallet =  blockchainState.createWallet(
//       walletName,
//       parseFloat(walletAmt)
//     );

//     // Optional: Add initial balance as "system" transaction and mine immediately
//     if (parseFloat(walletAmt) > 0) {
//       blockchainState.createTransaction(
//         parseFloat(walletAmt),
//         "SYSTEM",                 // ✅ matches Transaction isValid rules
//         newWallet.publicKey,
//         null                      // no private key for SYSTEM
//       );
//       blockchainState.mine();
//     }

//     // Update UI state
//     setWallets([...blockchainState.wallets]);
//     setBlocks([...blockchainState.chain]);

//     // Reset form
//     setWalletName("");
//     setWalletAmt("");
//     setWalletPopupOpen(false);
//   };

//   // Handle sending transaction from Wallet component
//   const handleSendTransaction = (fromId, toId, amount) => {
//     const sender = wallets.find((w) => w.id === fromId);
//     const recipient = wallets.find((w) => w.id === toId);

//     try {
//       blockchainState.createTransaction(
//         amount,
//         sender.publicKey,
//         recipient.publicKey,
//         sender.privateKey
//       );
//       alert("Transaction added to pending!");
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleMinePending = () => {
//     blockchainState.mine();
//     setBlocks([...blockchainState.chain]);
//     setWallets([...blockchainState.wallets]);
//   };

//   return (
//     <>
//       <div className={styles.pageContainer}>
//         <div className={styles.createWallet}>
//           <h2 className={styles.title}>Wallet</h2>
//           <button
//             className={styles.createWalletBtn}
//             onClick={() => setWalletPopupOpen(true)}
//           >
//             <span>+</span> New Wallet
//           </button>
//         </div>

//         {walletPopupOpen && (
//           <>
//             <div
//               className={styles.popupOverlay}
//               onClick={() => setWalletPopupOpen(false)}
//             />
//             <div className={styles.popupContainer}>
//               <div className={styles.popup}>
//                 <h2 className={styles.addWallet}>Create new Wallet</h2>
//                 <label>Name</label>
//                 <input
//                   type="text"
//                   placeholder="Wallet Name"
//                   value={walletName}
//                   onChange={(e) => setWalletName(e.target.value)}
//                 />
//                 <label>Amount</label>
//                 <input
//                   type="number"
//                   placeholder="Initial Amount"
//                   value={walletAmt}
//                   onChange={(e) => setWalletAmt(e.target.value)}
//                 />
//                 <div className={styles.btnContainer}>
//                   <button className={styles.addBtn} onClick={handleCreateBtn}>
//                     Create Wallet
//                   </button>
//                   <button
//                     className={styles.cancelBtn}
//                     onClick={() => setWalletPopupOpen(false)}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}

//         <div className={styles.showWallet}>
//           {wallets.map((wallet) => (
//             <Wallet
//               // key={wallet.id}
//               // walletAdd={wallet.id}
//               // walletName={wallet.name}
//               // walletAmt={wallet.balance}
//               // wallets={wallets}
//               // setWallets={setWallets}

//               key={wallet.id}
//               wallet={wallet}
//               wallets={wallets}
//               onSendTransaction={handleSendTransaction}
//             />
//           ))}
//         </div>

//         <div>
//           <h3 className={styles.blockTitle} style={{ color: "white" }}>
//             Blocks
//           </h3>
//           <button
//             className={styles.createWalletBtn}
//             onClick={handleMinePending}
//           >
//             Mine Pending Transactions
//           </button>
//           <div className={styles.showBlock}>
//             {blocks.map((block) => (
//               <Block key={block.id} block={block} />
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default WalletPage;

import Block from "../components/Blocks/Block";
import Wallet from "../components/Wallet/Wallet";
import PendingTransactions from "../components/PendingTransactions/PendingTxn";
import MiningStatus from "../components/Mining/Mining";
import { Blockchain } from "../lib/Blockchain";
import styles from "./WalletPage.module.css";

import { useEffect, useState } from "react";

const WalletPage = () => {
  const [blockchainState] = useState(() => new Blockchain());

  const [wallets, setWallets] = useState([]);
  const [walletPopupOpen, setWalletPopupOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletAmt, setWalletAmt] = useState("");

  const [blocks, setBlocks] = useState([]);
  const [showMiningStatus, setShowMiningStatus] = useState(false);

  useEffect(() => {
    setBlocks([...blockchainState.chain]);
  }, [blockchainState]);

  const handleCreateBtn = async () => {
    if (!walletName) return;

    // Create wallet in blockchain (always starts with 0 balance)
    const newWallet = blockchainState.createWallet(walletName, 0);

    // Only create initial funding transaction if amount > 0
    const initialAmount = parseFloat(walletAmt) || 0;
    if (initialAmount > 0) {
      blockchainState.createTransaction(
        initialAmount,
        "SYSTEM", // System sender
        newWallet.publicKey, // To the new wallet
        null // No private key for SYSTEM
      );
      blockchainState.mine(); // Mine immediately to fund the wallet
    }

    // Update UI state
    setWallets([...blockchainState.wallets]);
    setBlocks([...blockchainState.chain]);

    // Reset form
    setWalletName("");
    setWalletAmt("");
    setWalletPopupOpen(false);
  };

  // Handle sending transaction from Wallet component
  const handleSendTransaction = (fromId, toId, amount) => {
    const sender = wallets.find((w) => w.id === fromId);
    const recipient = wallets.find((w) => w.id === toId);

    if (!sender || !recipient) {
      alert("Sender or recipient wallet not found!");
      return;
    }

    try {
      blockchainState.createTransaction(
        amount,
        sender.publicKey,
        recipient.publicKey,
        sender.privateKey
      );
      alert("Transaction added to pending!");
      // Force re-render to update pending transactions count
      setWallets([...blockchainState.wallets]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMinePending = () => {
    if (blockchainState.pendingTransaction.length === 0) {
      alert("No pending transactions to mine!");
      return;
    }

    try {
      blockchainState.mine();
      setBlocks([...blockchainState.chain]);
      setWallets([...blockchainState.wallets]);
      alert("Transactions mined successfully!");
    } catch (err) {
      alert(`Mining failed: ${err.message}`);
    }
  };

  const handleMineComplete = () => {
    setBlocks([...blockchainState.chain]);
    setWallets([...blockchainState.wallets]);
    alert("Block mined successfully! 🎉");
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.createWallet}>
          <h2 className={styles.title}>Blockchain Wallet</h2>
          <button
            className={styles.createWalletBtn}
            onClick={() => setWalletPopupOpen(true)}
          >
            <span>+</span> New Wallet
          </button>
        </div>

        {walletPopupOpen && (
          <>
            <div
              className={styles.popupOverlay}
              onClick={() => setWalletPopupOpen(false)}
            />
            <div className={styles.popupContainer}>
              <div className={styles.popup}>
                <h2 className={styles.addWallet}>Create new Wallet</h2>
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Wallet Name"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
                <label>Initial Amount (optional)</label>
                <input
                  type="number"
                  placeholder="Initial Amount (0 if empty)"
                  value={walletAmt}
                  onChange={(e) => setWalletAmt(e.target.value)}
                />
                <div className={styles.btnContainer}>
                  <button className={styles.addBtn} onClick={handleCreateBtn}>
                    Create Wallet
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => setWalletPopupOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Wallets Section */}
        <div className={styles.showWallet}>
          {wallets.map((wallet) => (
            <Wallet
              key={wallet.id}
              wallet={wallet}
              wallets={wallets}
              onSendTransaction={handleSendTransaction}
            />
          ))}
        </div>

        {/* Pending Transactions Section */}
        <PendingTransactions
          pendingTransactions={blockchainState.pendingTransaction}
          onMineTransactions={handleMinePending}
        />

        {/* Mining Status Section */}
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <button
            className={styles.createWalletBtn}
            onClick={() => setShowMiningStatus(!showMiningStatus)}
            style={{ marginBottom: "15px" }}
          >
            {showMiningStatus ? "Hide" : "Show"} Mining Status
          </button>
        </div>

        <MiningStatus
          blockchain={blockchainState}
          onMineComplete={handleMineComplete}
          isVisible={showMiningStatus}
        />

        {/* Blocks Section */}
        <div>
          <h3 className={styles.blockTitle} style={{ color: "white" }}>
            Blockchain ({blocks.length} blocks)
          </h3>
          <div className={styles.showBlock}>
            {blocks.map((block, index) => (
              <Block key={`${block.hash}-${index}`} block={block} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletPage;
