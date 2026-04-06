import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          email,
          password,
          name,
        },
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0F] to-[#1A1A2E]">
      <div className="relative">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative glass-panel rounded-2xl p-8 w-96 animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3"></div>
            <h1 className="text-2xl font-bold text-white">Join the Cosmos</h1>
            <p className="text-gray-400 text-sm mt-2">Create your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username (unique)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                required
              />
            </div>

            <div className="mb-6">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Start Journey"}
            </button>
          </form>

          <p className="text-gray-400 text-center mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-500 hover:text-green-400 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
