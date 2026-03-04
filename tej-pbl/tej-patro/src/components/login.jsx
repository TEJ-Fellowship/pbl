import { GoogleLogin } from "@react-oauth/google";

function Login({ onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-[380px] mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-lg shadow-slate-200/50 p-10 text-center transition-all duration-200 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 flex flex-col items-center">
        <h1 className="text-xl font-medium text-slate-800 mb-1">Sign in</h1>
        <p className="text-slate-500 text-sm mb-8">
          Sign in to add events. Use your Google account to continue.
        </p>
        <div className="flex justify-center items-center">
          <div className="inline-flex justify-center rounded-lg max-w-[260px] transition-all duration-200 hover:ring-2 hover:ring-slate-200 hover:ring-offset-2 [&_iframe]:max-w-full">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                console.log("credential: ", credentialResponse);
                onBack?.();
              }}
              onError={() => {
                console.log("Login Failed");
              }}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Back to calendar
          </button>
        )}
      </div>
    </div>
  );
}
export default Login;
