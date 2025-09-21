import { useState, useCallback } from "react";
import ConfirmModal from "./ConfirmModal";

export function useConfirm() {
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    message: "",
    resolve: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmData({ isOpen: true, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmData.resolve(true);
    setConfirmData({ isOpen: false, message: "", resolve: null });
  };

  const handleCancel = () => {
    confirmData.resolve(false);
    setConfirmData({ isOpen: false, message: "", resolve: null });
  };

  const ConfirmComponent = (
    <ConfirmModal
      isOpen={confirmData.isOpen}
      message={confirmData.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmComponent };
}
