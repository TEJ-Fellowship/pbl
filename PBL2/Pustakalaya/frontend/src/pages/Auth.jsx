import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { consumePendingBorrow } from "../utils/pendingBorrowStorage";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  function handleLoginSuccess() {
    login();
    const pendingBookId = consumePendingBorrow();
    if (pendingBookId) {
      navigate(`/my-shelf?bookId=${encodeURIComponent(pendingBookId)}`, {
        replace: true,
      });
      return;
    }
    const from = location.state?.from;
    const safeFrom =
      typeof from === "string" && from.startsWith("/") && from !== "/auth"
        ? from
        : "/";
    navigate(safeFrom, { replace: true });
  }

  return (
    <div>
      <h1>Auth Page</h1>
      {/* TODO: Wire this to the real auth flow; call handleLoginSuccess when login succeeds */}
      <button type="button" onClick={handleLoginSuccess}   className="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
      >
        Continue (dummy login)
      </button>
    </div>
  );
};

export default Auth;
