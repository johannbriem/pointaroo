import { supabase } from "../supabaseClient";

export const acceptFamilyInvite = async (code) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return { error: "Not logged in." };

  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (inviteError || !invite) return { error: "Invite not found or expired." };

  const { family_id, role, expires_at } = invite;

  if (expires_at && new Date(expires_at) < new Date()) {
    return { error: "Invite has expired." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ family_id, role })
    .eq("id", user.data.user.id);

  if (profileError) return { error: "Failed to join family." };

  await supabase.from("invites").delete().eq("code", code);

  return { success: true };
};
