import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function VisitorAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAuth() {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return alert(error.message);

      navigate("/map");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return alert(error.message);

      alert("Account created! You can now log in.");
      setIsLogin(true);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isLogin ? "Welcome back" : "Create account"}</h2>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleAuth}>
          {isLogin ? "Log In" : "Create Account"}
        </button>

        <p style={styles.switch}>
          {isLogin ? "No account?" : "Already have one?"}
          <span onClick={() => setIsLogin(!isLogin)} style={styles.link}>
            {isLogin ? " Sign up" : " Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "320px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  button: {
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    borderRadius: "8px",
    background: "#173d33",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  switch: {
    marginTop: "15px",
    fontSize: "14px",
  },
  link: {
    color: "#173d33",
    cursor: "pointer",
    marginLeft: "5px",
  },
};