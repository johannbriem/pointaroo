import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


export default function JoinPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking invite...");

  useEffect(() => {
    const acceptInvite = async () => {
      const inviteCode = new URLSearchParams(location.search).get("code");

        if (!inviteCode) {
          setStatus("No invite code provided.");
          return;
        }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("You need to be logged in to accept an invite. Redirecting to login...");
        // Store the path to redirect back to after login
        sessionStorage.setItem("postLoginRedirect", `/join-family?code=${inviteCode}`);
        navigate("/login");
        return;
      }

      const { data: invite, error } = await supabase
        .from("invites")
        .select("*, family_id, role, expires_at")
        .eq("code", inviteCode)
        .maybeSingle();

      if (error || !invite) {
        setStatus("Invalid or expired invite.");
        return;
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setStatus("This invite has expired.");
        return;
      }

      const { family_id, role } = invite;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ family_id, role })
        .eq("id", user.id);

      if (updateError) {
        setStatus(`Failed to join family: ${updateError.message}`);
        return;
      }

      await supabase.from("invites").delete().eq("code", inviteCode);

      setStatus("Successfully joined the family! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    };

    acceptInvite();
  }, [location, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-xl">{status}</div>
    </div>
  );
}
