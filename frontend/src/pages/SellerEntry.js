import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getSellerEntryRoute } from "../lib/sellerRouting";

export default function SellerEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function resolveSellerRoute() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData?.user || null;

        if (!user) {
          if (mounted) navigate("/seller-auth", { replace: true });
          return;
        }

        const { data: businesses, error: businessError } = await supabase
          .from("businesses")
          .select("id, user_id, status, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (businessError) throw businessError;

        if (mounted) {
          navigate(getSellerEntryRoute(user, businesses || []), { replace: true });
        }
      } catch (err) {
        console.error("Seller entry route error:", err);
        if (mounted) navigate("/seller-auth", { replace: true });
      }
    }

    resolveSellerRoute();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>Loading seller area...</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f8fafc",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  card: {
    padding: "18px 22px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
    color: "#475569",
    fontWeight: 700,
  },
};
