'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/app/lib/types';

/**
 * Server Action: Update a user's role.
 * Only Administrators can perform this action.
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: Role
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Verify the caller is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated. Please sign in.' };
  }

  // 2. Fetch the caller's profile to check their role
  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !callerProfile) {
    return { success: false, error: 'Could not verify your permissions.' };
  }

  // 3. RBAC check: Only Administrators can change user roles
  if (callerProfile.role !== 'Administrator') {
    return {
      success: false,
      error: 'Unauthorized. Only Administrators can change user roles.',
    };
  }

  // 4. Validate the new role
  const validRoles: Role[] = ['Administrator', 'Manager', 'Cashier'];
  if (!validRoles.includes(newRole)) {
    return { success: false, error: `Invalid role: ${newRole}` };
  }

  // 5. Prevent admins from demoting themselves
  if (targetUserId === user.id) {
    return {
      success: false,
      error: 'You cannot change your own role.',
    };
  }

  // 6. Perform the update
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 7. Revalidate the team page so it reflects the change
  revalidatePath('/team');

  return { success: true };
}
