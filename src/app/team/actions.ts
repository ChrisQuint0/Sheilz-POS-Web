'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Role, Status } from '@/app/lib/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> = T extends undefined
  ? { success: boolean; error?: string }
  : { success: boolean; error?: string; data?: T };

/** Verify the calling user is an authenticated Administrator. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, error: 'Not authenticated. Please sign in.' };
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !callerProfile) {
    return { ok: false as const, error: 'Could not verify your permissions.' };
  }

  if (callerProfile.role !== 'Administrator') {
    return {
      ok: false as const,
      error: 'Unauthorized. Only Administrators can manage team members.',
    };
  }

  return { ok: true as const, userId: user.id, supabase };
}

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchTeamMembers(): Promise<
  ActionResult<{
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    role: Role;
    status: Status;
    last_login: string | null;
    created_at: string;
  }[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url, role, status, last_login, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

// ── Create User ──────────────────────────────────────────────────────────────

export async function createUser(input: {
  displayName: string;
  email: string;
  password: string;
  role: Role;
  avatarUrl?: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabaseAdmin = createAdminClient();

  // 1. Create the auth user (the DB trigger auto-creates the profile row)
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
      },
    });

  if (createError) {
    return { success: false, error: createError.message };
  }

  // 2. Update the auto-created profile with the chosen role & display name
  //    (the trigger only sets a basic display_name from metadata)
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      display_name: input.displayName,
      role: input.role,
      avatar_url: input.avatarUrl || null,
    })
    .eq('id', newUser.user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/team');
  return { success: true };
}

// ── Update User ──────────────────────────────────────────────────────────────

export async function updateUser(
  targetUserId: string,
  updates: {
    displayName?: string;
    email?: string;
    role?: Role;
    status?: Status;
    avatarUrl?: string | null;
  }
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  // Prevent admins from demoting themselves
  if (targetUserId === auth.userId && updates.role && updates.role !== 'Administrator') {
    return { success: false, error: 'You cannot change your own role.' };
  }

  const profileUpdates: Record<string, any> = {};
  if (updates.displayName !== undefined) profileUpdates.display_name = updates.displayName;
  if (updates.email !== undefined) profileUpdates.email = updates.email;
  if (updates.role !== undefined) profileUpdates.role = updates.role;
  if (updates.status !== undefined) profileUpdates.status = updates.status;
  if (updates.avatarUrl !== undefined) profileUpdates.avatar_url = updates.avatarUrl;

  if (Object.keys(profileUpdates).length === 0) {
    return { success: false, error: 'No changes provided.' };
  }

  const { error } = await auth.supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  // If email was changed, also update in auth.users
  if (updates.email) {
    const supabaseAdmin = createAdminClient();
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { email: updates.email }
    );
    if (authUpdateError) {
      // Non-fatal: profile was already updated
      console.warn('Failed to update email in auth.users:', authUpdateError.message);
    }
  }

  revalidatePath('/team');
  return { success: true };
}

// ── Delete User ──────────────────────────────────────────────────────────────

export async function deleteUser(targetUserId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (targetUserId === auth.userId) {
    return { success: false, error: 'You cannot delete your own account.' };
  }

  // Check for associated orders
  const { count, error: countError } = await auth.supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .or(`cashier_id.eq.${targetUserId},created_by.eq.${targetUserId}`);

  if (countError) {
    return { success: false, error: 'Failed to check for associated records.' };
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `This user has ${count} associated order(s) and cannot be deleted. Set their status to Inactive instead.`,
    };
  }

  // Delete from auth (cascades to profiles via FK)
  const supabaseAdmin = createAdminClient();
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath('/team');
  return { success: true };
}

// ── Reset Password ───────────────────────────────────────────────────────────

export async function resetUserPassword(
  targetUserId: string,
  newPassword: string
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ── Import Users (Batch) ─────────────────────────────────────────────────────

export async function importUsers(
  users: { displayName: string; email: string; password: string; role: Role }[]
): Promise<ActionResult<{ created: number; failed: { email: string; error: string }[] }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabaseAdmin = createAdminClient();
  let created = 0;
  const failed: { email: string; error: string }[] = [];

  for (const row of users) {
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: row.email,
        password: row.password,
        email_confirm: true,
        user_metadata: { display_name: row.displayName },
      });

    if (createError) {
      failed.push({ email: row.email, error: createError.message });
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: row.displayName,
        role: row.role,
      })
      .eq('id', newUser.user.id);

    if (updateError) {
      failed.push({ email: row.email, error: updateError.message });
      continue;
    }

    created++;
  }

  revalidatePath('/team');
  return { success: true, data: { created, failed } };
}
