import { useState, useCallback } from "react";
import AlertModal from "./AlertModal";

export function useAlert() {
  const [alertData, setAlertData] = useState({
    isOpen: false,
    message: "",
    type: "info",
  });

  const showAlert = useCallback((message, type = "info") => {
    setAlertData({ isOpen: true, message, type });
  }, []);

  const handleClose = () => {
    setAlertData({ ...alertData, isOpen: false });
  };

  const AlertComponent = (
    <AlertModal
      isOpen={alertData.isOpen}
      message={alertData.message}
      type={alertData.type}
      onClose={handleClose}
    />
  );

  return { showAlert, AlertComponent };
}
