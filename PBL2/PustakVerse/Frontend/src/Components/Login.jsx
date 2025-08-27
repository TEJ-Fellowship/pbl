import React, { useState } from "react";

const Login =({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch("http://localhost:3001/api/api/auth/login", {
            methos: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({email, password}),
        });
        const data = await res.json();
        if (data.token) {
            localstorage.setitem("token", data.token);
            onLogin(data.user);
        } else {
            alert(data.error);
        }
    };
    return (
        <form onSubmit={handleLogin} className="space-y-3 p-4 border rounded">
        <h2 className="text-lg font-bold">Login</h2>
        <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
        />
        <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            Login
        </button>
        </form>
    );
};

export default Login;