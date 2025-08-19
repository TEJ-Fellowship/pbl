import { useNavigate } from "react-router-dom";

export default function NavFeature() {
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;  // if nothing chosen
    navigate("/Resume");  
  };

  return (
    <div>
      {/* <h2>Upload Resume</h2>
      <input className="p-40"type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} /> */}
      
    </div>
  );
}
