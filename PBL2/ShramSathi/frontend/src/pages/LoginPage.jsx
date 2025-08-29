import React, { useState } from "react";
import { Link ,useNavigate} from "react-router-dom";
import axios from "axios";
const LoginPage = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault();
    axios
      .post("http://localhost:3000/auth/login", 
      {
         email:loginEmail, 
         password:loginPassword 
        })
      .then((res) => {
        let jsonToken = res.data.token;
        localStorage.setItem("token", jsonToken);
        navigate('/dashboardpage')

      })
      .catch((err) => console.log(err));
  }

  return (
    <div>
      <section className="bg-gray-50">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-blue-600 md:text-2xl text-center">
                Login
              </h1>

              <form
                className="space-y-4 md:space-y-6"
                action="#"
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    htmlFor="loginEmail"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-black"
                  >
                    Your Email
                  </label>

                  <input
                    type="email"
                    name="loginEmail"
                    id="loginEmail"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="name@company.com"
                    required=""
                    autoComplete="off"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="loginPassword"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-black"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="loginPassword"
                    id="loginPassword"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required=""
                    autoComplete="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <a
                    href="#"
                    className="font-medium text-primary-600 hover:underline dark:text-blue-500"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Login
                </button>

                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Don't have an account yet?
                  <Link
                    to="/signUp"
                    className="font-medium text-primary-600 hover:underline dark:text-blue-500"
                  >
                    Sign Up
                  </Link>
                  {/* <a href="#" className="font-medium text-primary-600 hover:underline dark:text-blue-500">Sign Up</a> */}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
