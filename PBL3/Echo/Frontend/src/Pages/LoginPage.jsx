

function LoginForm () {
    return (
        <div className="h-screen flex justify-center items-center">
            <form className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-400 w-80" >
                <h1 className="text-2xl font-extrabold">Welcome Back</h1>
                <p className="mb-5">Please Enter your Account details</p>
                <p className='mb-2'>Email</p>
                <input className="px-2 h-8 border-2 w-full border-green-600 focus: outline-none rounded-lg" type='text' placeholder='username@email.com'/>
                <p className='mt-5 mb-2'>Password</p>
                <input className="px-2 h-8 border-2 w-full border-green-600 focus: outline-none rounded-lg" type='password' placeholder='*******' />
                <p className='flex justify-end mt-1 text-sm underline'>Forgot Password</p>
                <button type='submit' className="mt-5 p-2 py-2 w-full bg-green-600 rounded-lg text-white font-semibold">Sign in</button>
            </form>
        </div>
    );
}

export default LoginForm;