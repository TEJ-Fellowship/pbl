 import { useState } from "react";

const RegistrForm=()=>{
          const [fullName, setFullName] = useState("");
          const [email, setEmail] = useState("");
          const [password, setPassword] = useState("");
        
          console.log(fullName, "fullName");
          console.log(email, "email");
          console.log(password, "password");
        
          // const handleLogin=()={
        
          // }
          return (
            <>
              <div>
                <p>SkillUp AI</p>
                <p>
                  Full Name:{" "}
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    placeholder="type full name"
                  ></input>
                </p>
                <p>
                  Email:{" "}
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="type email"
                  ></input>
                </p>
                <p>
                  Password:{" "}
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="type password"
                  ></input>
                </p>
                <button>Sign Up</button> {/* onClick={handleLogin} */}
        
                <p>Already have Account? Sign In</p>
              </div>
        
        </>
    )
}
export default RegistrForm;