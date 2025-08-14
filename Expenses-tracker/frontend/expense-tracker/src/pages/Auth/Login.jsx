import React, { useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../Utils/helper';

import  axiosInstance  from '../../Utils/axiosInstance.js';
import { API_PATHS } from '../../Utils/apiPaths';

import { UserContext } from '../../context/userContext.jsx';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  //use of UserContext here too
  const { updateUser } = useContext(UserContext);


  const navigate = useNavigate();


  //handle login format
  const handleLogin =async(e) =>{
      e.preventDefault();

      //it will be in helper.js mw ok
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (!password) { 
        setError("Please enter the password.");
        return;
      }

      setError("");

      //Login API call
      try {
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
          email,
          password,
        });
        const { token, user } = response.data;


        //token xa vane 
        if (token) {
          localStorage.setItem('token', token);
          // localStorage.setItem('user', JSON.stringify(user));
          //hehe
          updateUser(user);
          navigate('/dashboard'); // Redirect to dashboard on successful login
        } 
      } catch (err) {
        if (err.response && err.response.data.message) {
          setError(err.response.data.message || "Login failed. Please try again.");
        } else {
          setError("An something went wrong. Please try again later.");
        }
      }
  }

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <div className="text-xl font-semibold text-black">Welcome Back</div>
        <p className='text-xs text-slate-700 mt-[5px] mb-6'>
          Please enter your details to log in 
        </p>
      <form onSubmit={handleLogin}>
        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label="Email Address"
          placeholder="akash@exmample.com"
          type="text"
        />
        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label="Password"
          placeholder="Min 8 Characters"
          type="password"
        />

        {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

        <button type='submit' className="btn-primary">LOGIN</button>

        <p className='text-[13px] text-slate-800 mt-3'>
          Don't have an account?{" "}
          <Link className="font-medium text-primary underline" to="/signUp">SignUp</Link>
        </p>
        
      </form>



      </div>
    </AuthLayout>
  )
}

export default Login