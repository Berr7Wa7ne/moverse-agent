import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agentProfile, setAgentProfile] = useState();

  async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Ensure there is a matching agent profile row
    const defaultName = email.split("@")[0] || "Agent";
    const { error: agentError } = await supabase
      .from("agents")
      .upsert(
        {
          email,
          name: defaultName,
          role: "agent",
        },
        { onConflict: "email" }
      );

    if (agentError) {
      console.error("[auth] Failed to upsert agent profile", agentError);
    }

    return data;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  function updateUserProfile() {
    return Promise.resolve();
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setCurrentUser(user);

      if (user?.email) {
        const { data: agent, error: agentError } = await supabase
          .from("agents")
          .select("id, name, email, role")
          .eq("email", user.email)
          .maybeSingle();
        if (!agentError) {
          setAgentProfile(agent || null);
        }
      } else {
        setAgentProfile(null);
      }
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user?.email) {
        supabase
          .from("agents")
          .select("id, name, email, role")
          .eq("email", user.email)
          .maybeSingle()
          .then(({ data: agent, error: agentError }) => {
            if (!agentError) {
              setAgentProfile(agent || null);
            }
          });
      } else {
        setAgentProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    agentProfile,
    error,
    setError,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
