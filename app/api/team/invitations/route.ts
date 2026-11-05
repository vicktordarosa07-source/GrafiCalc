import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { readRequestTextLimited, RequestBodyTooLargeError } from "@/lib/http/request-body";
import { getBillingAccess } from "@/lib/billing/access";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
}).strict();

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let origin = "";
  try { origin = new URL(configured || request.url).origin; }
  catch { throw new WorkspaceError("invite-origin-not-configured", 503); }
  const hostname = new URL(origin).hostname;
  if (process.env.NODE_ENV === "production" && !["graficalc.com.br", "www.graficalc.com.br"].includes(hostname)) {
    throw new WorkspaceError("invite-origin-not-configured", 503);
  }
  if (process.env.NODE_ENV !== "production" && !["http:", "https:"].includes(new URL(origin).protocol)) {
    throw new WorkspaceError("invite-origin-not-configured", 503);
  }
  return origin;
}

export async function POST(request: Request) {
  let invitationId: string | null = null;
  let context: Awaited<ReturnType<typeof getWorkspaceContext>> = null;
  try {
    assertSameOrigin(request);
    context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    if (!context.isLeader) throw new WorkspaceError("team-leader-required", 403);

    const billing = await getBillingAccess(context.admin, context.tenantId);
    if (!billing.allowed) {
      return Response.json({ ok: false, error: "subscription-required", billingUrl: "/assinatura" }, {
        status: 402, headers: { "Cache-Control": "private, no-store" },
      });
    }

    let raw: string;
    try { raw = await readRequestTextLimited(request, 4096); }
    catch (error) {
      if (error instanceof RequestBodyTooLargeError) throw new WorkspaceError("payload-too-large", 413);
      throw error;
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new WorkspaceError("invalid-payload", 400); }
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) throw new WorkspaceError("invalid-invitation", 400);

    const email = parsed.data.email.toLowerCase();
    const name = parsed.data.nome;
    const now = new Date();
    const nowIso = now.toISOString();

    const { error: expiredError } = await context.admin.from("graficalc_team_invitations")
      .update({ status: "expired" }).eq("status", "pending").lte("expires_at", nowIso);
    if (expiredError) throw new WorkspaceError("team-invitation-storage-unavailable", 503);

    const { data: existingProfile, error: profileError } = await context.admin.from("profiles")
      .select("id").ilike("email", email).limit(1).maybeSingle();
    if (profileError) throw new WorkspaceError("team-invitation-storage-unavailable", 503);
    if (existingProfile) throw new WorkspaceError("team-email-already-registered", 409);

    const { data: existingInvite, error: inviteLookupError } = await context.admin.from("graficalc_team_invitations")
      .select("id").eq("email", email).eq("status", "pending").limit(1).maybeSingle();
    if (inviteLookupError) throw new WorkspaceError("team-invitation-storage-unavailable", 503);
    if (existingInvite) throw new WorkspaceError("team-invitation-already-pending", 409);

    const { count, error: countError } = await context.admin.from("graficalc_team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", context.tenantId).gte("created_at", new Date(now.getTime() - 15 * 60_000).toISOString());
    if (countError) throw new WorkspaceError("team-invitation-storage-unavailable", 503);
    if ((count || 0) >= 10) throw new WorkspaceError("team-invitation-rate-limited", 429);

    const invitationToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(invitationToken).digest("hex");
    const { data: invitation, error: createError } = await context.admin.from("graficalc_team_invitations")
      .insert({ tenant_id: context.tenantId, invited_by: context.user.id, email, nome: name, token_hash: tokenHash })
      .select("id").single();
    if (createError || !invitation) throw new WorkspaceError("team-invitation-storage-unavailable", 503);
    invitationId = invitation.id;

    const callback = new URL("/auth/confirm", siteOrigin(request));
    callback.searchParams.set("next", "/workspace");
    const { data, error: authError } = await context.admin.auth.admin.inviteUserByEmail(email, {
      data: { nome: name, graficalc_invitation_token: invitationToken },
      redirectTo: callback.toString(),
    });
    if (authError || !data.user) {
      const { data: inviteState } = await context.admin.from("graficalc_team_invitations")
        .select("status,user_id").eq("id", invitationId).maybeSingle();
      if (inviteState?.status === "pending") {
        await context.admin.from("graficalc_team_invitations").update({ status: "cancelled" }).eq("id", invitationId);
      }
      throw new WorkspaceError("team-invitation-send-failed", 502);
    }

    await context.admin.auth.admin.updateUserById(data.user.id, { user_metadata: { nome: name } });

    const { data: profile, error: verifyError } = await context.admin.from("profiles")
      .select("id,tenant_id,papel,nome,email,email_confirmado,criado_em")
      .eq("id", data.user.id).maybeSingle();
    if (verifyError || profile?.tenant_id !== context.tenantId || profile?.papel !== "funcionario") {
      throw new WorkspaceError("team-invitation-provisioning-failed", 503);
    }

    return Response.json({
      ok: true,
      member: {
        id: profile.id, username: profile.nome, email: profile.email,
        company: context.profile.empresa, role: "employee", developerAccess: false,
        status: profile.email_confirmado ? "active" : "pending", groupId: "funcionarios",
        teamLeader: false, createdAt: profile.criado_em,
        emailVerification: { status: profile.email_confirmado ? "verified" : "pending" },
      },
      message: "team-invitation-sent",
    }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (invitationId && context) {
      await context.admin.from("graficalc_team_invitations")
        .update({ status: "cancelled" }).eq("id", invitationId).eq("status", "pending");
    }
    return workspaceError(error);
  }
}
