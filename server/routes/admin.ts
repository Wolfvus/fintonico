import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/adminAuth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// ============================================
// User Management Routes
// ============================================

/**
 * GET /api/admin/users
 * List all users (admin+)
 */
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_USERS_ERROR' });
    }

    res.json({ users: data });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details (admin+)
 */
router.get('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }
      return res.status(500).json({ error: error.message, code: 'FETCH_USER_ERROR' });
    }

    res.json({ user: data });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (super_admin only)
 */
router.post('/users', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message, code: 'CREATE_USER_ERROR' });
    }

    // Update profile with role if specified
    if (role || displayName) {
      await supabaseAdmin
        .from('user_profiles')
        .update({
          ...(role && { role }),
          ...(displayName && { display_name: displayName }),
        })
        .eq('id', authData.user.id);
    }

    // Fetch the created profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Log the action
    await logAdminAction(req.userId!, 'user.create', authData.user.id, { email, role });

    res.status(201).json({ user: profile });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user (super_admin only)
 */
router.put('/users/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, role, isActive } = req.body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined) updates.display_name = displayName;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, code: 'UPDATE_USER_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'user.update', id, { updates });

    res.json({ user: data });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (super_admin only)
 */
router.delete('/users/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account', code: 'SELF_DELETE_ERROR' });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      return res.status(500).json({ error: error.message, code: 'DELETE_USER_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'user.delete', id);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Change user role (super_admin only)
 */
router.put('/users/:id/role', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['super_admin', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role', code: 'VALIDATION_ERROR' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, code: 'UPDATE_ROLE_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'user.role_change', id, { newRole: role });

    res.json({ user: data });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ============================================
// User Data Access Routes
// ============================================

/**
 * GET /api/admin/users/:id/accounts
 * Get user's accounts (admin+)
 */
router.get('/users/:id/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_ACCOUNTS_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'data.view', id, { dataType: 'accounts' });

    res.json({ accounts: data });
  } catch (err) {
    console.error('Error fetching user accounts:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/admin/users/:id/expenses
 * Get user's expenses (admin+)
 */
router.get('/users/:id/expenses', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_EXPENSES_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'data.view', id, { dataType: 'expenses' });

    res.json({ expenses: data });
  } catch (err) {
    console.error('Error fetching user expenses:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/admin/users/:id/incomes
 * Get user's incomes (admin+)
 */
router.get('/users/:id/incomes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('income')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_INCOMES_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'data.view', id, { dataType: 'incomes' });

    res.json({ incomes: data });
  } catch (err) {
    console.error('Error fetching user incomes:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ============================================
// System Configuration Routes
// ============================================

/**
 * GET /api/admin/config
 * Get all system config (admin+)
 */
router.get('/config', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .order('key');

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_CONFIG_ERROR' });
    }

    res.json({ config: data });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/admin/config/:key
 * Update system config (super_admin only)
 */
router.put('/config/:key', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required', code: 'VALIDATION_ERROR' });
    }

    const { data, error } = await supabaseAdmin
      .from('system_config')
      .update({
        value,
        updated_by: req.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, code: 'UPDATE_CONFIG_ERROR' });
    }

    // Log the action
    await logAdminAction(req.userId!, 'config.update', undefined, { key, value });

    res.json({ config: data });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ============================================
// Audit Log Routes
// ============================================

/**
 * GET /api/admin/audit-log
 * Get audit log (super_admin only)
 */
router.get('/audit-log', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const { data, error } = await supabaseAdmin
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message, code: 'FETCH_AUDIT_LOG_ERROR' });
    }

    res.json({ auditLog: data });
  } catch (err) {
    console.error('Error fetching audit log:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ============================================
// Helper Functions
// ============================================

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId,
      details,
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

export default router;
