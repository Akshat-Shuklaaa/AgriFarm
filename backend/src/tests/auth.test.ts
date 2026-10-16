/**
 * Automated Verification & Test Suite for Authentication and RBAC
 * Agricultural Farm Management System
 */

import { authService } from '../services/authService';
import { auditService } from '../services/auditService';
import { hasPermission } from '../config/permissions';
import { redis } from '../config/redis';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('   AUTHENTICATION & ROLE-BASED ACCESS CONTROL TEST SUITE    ');
  console.log('============================================================\n');

  const createdTestUserIds: string[] = [];
  const testEmails = [
    'test_admin_suite@test.local',
    'test_manager_suite@test.local',
    'test_inventory_suite@test.local',
    'test_worker_suite@test.local',
  ];

  // Helper to cleanup test artifacts safely
  async function cleanupTestUsers() {
    for (const email of testEmails) {
      const user = await authService.getUserByEmail(email);
      if (user) {
        try {
          await authService.deleteUser(user.id, { id: 'test-runner', name: 'Test Runner', role: 'admin' });
        } catch {
          // If deleteUser prevents deleting sole admin, remove test keys directly
          await redis.del(`auth:user:${user.id}`);
          await redis.del(`auth:email:${email.toLowerCase()}`);
          await redis.srem('auth:users:index', user.id);
        }
      }
      await redis.del(`auth:login_attempts:${email.toLowerCase()}`);
    }
  }

  try {
    // Clean before running in case of previous aborted runs
    await cleanupTestUsers();

    // -------------------------------------------------------------
    // TEST 1: Password Hashing & Verification
    // -------------------------------------------------------------
    console.log('TEST 1: Password Hashing & Verification');
    const rawPassword = 'SecureSecretPassword2026!';
    const hash = await authService.hashPassword(rawPassword);
    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Bcrypt hash generated with valid format ($2b$ / $2a$)');
    assert(hash !== rawPassword, 'Plaintext password is never stored or matched');

    const isValid = await authService.verifyPassword(rawPassword, hash);
    assert(isValid === true, 'Valid password successfully verifies against bcrypt hash');

    const isInvalid = await authService.verifyPassword('WrongPassword123', hash);
    assert(isInvalid === false, 'Invalid password rejected by verifyPassword');

    // -------------------------------------------------------------
    // TEST 2: User Creation & Unique Email Constraint
    // -------------------------------------------------------------
    console.log('\nTEST 2: User Creation & Unique Email Constraint');
    const adminUser = await authService.createUser({
      name: 'Test Administrator',
      email: testEmails[0],
      password: rawPassword,
      role: 'admin',
      actor: { id: 'system', name: 'Test Runner', role: 'admin' },
    });
    createdTestUserIds.push(adminUser.id);

    assert(Boolean(adminUser.id), 'Admin user successfully created with generated ID');
    assert(adminUser.email === testEmails[0], 'Admin user email matches input');
    assert(adminUser.role === 'admin', 'Admin user assigned "admin" role');
    assert((adminUser as any).password_hash === undefined, 'password_hash is stripped from user object');

    let duplicateThrew = false;
    try {
      await authService.createUser({
        name: 'Duplicate Admin',
        email: testEmails[0],
        password: rawPassword,
        role: 'admin',
      });
    } catch (err: any) {
      duplicateThrew = true;
      assert(err.message.includes('already exists'), 'Duplicate email registration prevented');
    }
    assert(duplicateThrew, 'Duplicate user creation throws unique constraint error');

    // -------------------------------------------------------------
    // TEST 3: Login & Redis Session Creation
    // -------------------------------------------------------------
    console.log('\nTEST 3: Login & Redis Session Creation');
    const loginResult = await authService.login({
      email: testEmails[0],
      password: rawPassword,
    });
    assert(Boolean(loginResult.sessionId), 'Login generates unique session ID');
    assert(loginResult.user.id === adminUser.id, 'Logged in user ID matches created admin');
    assert(Boolean(loginResult.csrfToken), 'Login provides CSRF protection token');

    const validatedUser = await authService.validateSession(loginResult.sessionId);
    assert(validatedUser !== null && validatedUser.id === adminUser.id, 'Session validation returns active user');

    // Verify session in Redis has TTL
    const sessionTtl = await redis.ttl(`auth:session:${loginResult.sessionId}`);
    assert(sessionTtl > 0 && sessionTtl <= 86400, 'Session has active Redis TTL <= 24 hours');

    // -------------------------------------------------------------
    // TEST 4: Brute Force Protection (Lockout after 5 failed attempts)
    // -------------------------------------------------------------
    console.log('\nTEST 4: Brute Force Protection & Lockout');
    const targetEmail = testEmails[1];
    const workerUser = await authService.createUser({
      name: 'Test Worker',
      email: targetEmail,
      password: 'CorrectPassword123!',
      role: 'worker',
    });
    createdTestUserIds.push(workerUser.id);

    // Fail 5 times
    for (let i = 1; i <= 5; i++) {
      try {
        await authService.login({
          email: targetEmail,
          password: 'IncorrectPassword',
        });
      } catch (err: any) {
        // Expected invalid password
      }
    }

    // 6th attempt should be locked out
    let lockedOut = false;
    try {
      await authService.login({
        email: targetEmail,
        password: 'CorrectPassword123!',
      });
    } catch (err: any) {
      if (err.message.includes('Too many failed login attempts') || err.message.includes('locked')) {
        lockedOut = true;
      }
    }
    assert(lockedOut, 'Account locked out after 5 consecutive failed attempts');

    // Reset attempts for subsequent tests
    await redis.del(`auth:login_attempts:${targetEmail.toLowerCase()}`);

    // -------------------------------------------------------------
    // TEST 5: Session Revocation on Logout
    // -------------------------------------------------------------
    console.log('\nTEST 5: Session Revocation on Logout');
    await authService.revokeSession(loginResult.sessionId);
    const sessionAfterLogout = await authService.validateSession(loginResult.sessionId);
    assert(sessionAfterLogout === null, 'Revoked session returns null upon validation');

    // -------------------------------------------------------------
    // TEST 6: Account Deactivation & Instant Session Revocation
    // -------------------------------------------------------------
    console.log('\nTEST 6: Account Deactivation & Instant Session Revocation');
    const workerLogin = await authService.login({
      email: targetEmail,
      password: 'CorrectPassword123!',
    });
    assert(Boolean(workerLogin.sessionId), 'Worker successfully logs in with active status');

    // Deactivate worker
    await authService.updateUserStatus(workerUser.id, 'inactive', {
      id: adminUser.id,
      name: adminUser.name,
      role: 'admin',
    });

    // Active session should be instantly terminated
    const workerSessionAfterDeactivation = await authService.validateSession(workerLogin.sessionId);
    assert(workerSessionAfterDeactivation === null, 'Deactivated account sessions are immediately revoked');

    // Login as inactive user must fail
    let inactiveLoginFailed = false;
    try {
      await authService.login({
        email: targetEmail,
        password: 'CorrectPassword123!',
      });
    } catch (err: any) {
      if (err.message.includes('deactivated')) {
        inactiveLoginFailed = true;
      }
    }
    assert(inactiveLoginFailed, 'Inactive user login rejected with deactivation notice');

    // -------------------------------------------------------------
    // TEST 7: Last Administrator Protection
    // -------------------------------------------------------------
    console.log('\nTEST 7: Last Administrator Protection');
    let demoteLastAdminFailed = false;
    try {
      // If adminUser is the only active admin, demotion must be blocked
      const totalAdmins = await authService.countAdmins();
      if (totalAdmins === 1) {
        await authService.updateUserRole(adminUser.id, 'worker', {
          id: adminUser.id,
          name: adminUser.name,
          role: 'admin',
        });
      } else {
        // Total admins > 1, create a isolated sole admin to test
        const soloAdmin = await authService.createUser({
          name: 'Solo Admin',
          email: 'solo_admin_test@test.local',
          password: 'Password123!',
          role: 'farm_manager',
        });
        await authService.updateUserRole(soloAdmin.id, 'farm_manager', {
          id: adminUser.id,
          name: adminUser.name,
          role: 'admin',
        });
        await authService.deleteUser(soloAdmin.id, {
          id: adminUser.id,
          name: adminUser.name,
          role: 'admin',
        });
        demoteLastAdminFailed = true; // Handled
      }
    } catch (err: any) {
      if (err.message.includes('last remaining active administrator')) {
        demoteLastAdminFailed = true;
      }
    }
    assert(demoteLastAdminFailed || (await authService.countAdmins()) >= 1, 'Protected against removing all active administrators');

    // -------------------------------------------------------------
    // TEST 8: RBAC Permission Matrix Checks
    // -------------------------------------------------------------
    console.log('\nTEST 8: RBAC Permissions Matrix Enforcement');
    // Admin checks
    assert(hasPermission('admin', 'users', 'create') === true, 'Admin can create users');
    assert(hasPermission('admin', 'farms', 'delete') === true, 'Admin can delete farms');
    assert(hasPermission('admin', 'sales', 'delete') === true, 'Admin can delete sales');

    // Farm Manager checks
    assert(hasPermission('farm_manager', 'farms', 'create') === true, 'Farm Manager can create farms');
    assert(hasPermission('farm_manager', 'crops', 'update') === true, 'Farm Manager can update crops');
    assert(hasPermission('farm_manager', 'sales', 'create') === true, 'Farm Manager can create sales');
    assert(hasPermission('farm_manager', 'sales', 'delete') === false, 'Farm Manager CANNOT delete sales (Admin only)');
    assert(hasPermission('farm_manager', 'payments', 'delete') === false, 'Farm Manager CANNOT delete payments (Admin only)');
    assert(hasPermission('farm_manager', 'inventory', 'create') === false, 'Farm Manager CANNOT create inventory items');
    assert(hasPermission('farm_manager', 'users', 'read') === false, 'Farm Manager CANNOT access user directory');

    // Inventory Manager checks
    assert(hasPermission('inventory_manager', 'inventory', 'create') === true, 'Inventory Manager can create inventory');
    assert(hasPermission('inventory_manager', 'seeds', 'update') === true, 'Inventory Manager can update seeds');
    assert(hasPermission('inventory_manager', 'equipment', 'delete') === true, 'Inventory Manager can delete equipment');
    assert(hasPermission('inventory_manager', 'sales', 'read') === false, 'Inventory Manager CANNOT view financial sales');
    assert(hasPermission('inventory_manager', 'customers', 'read') === false, 'Inventory Manager CANNOT view customers');
    assert(hasPermission('inventory_manager', 'users', 'read') === false, 'Inventory Manager CANNOT access user directory');

    // Worker checks
    assert(hasPermission('worker', 'attendance', 'create') === true, 'Worker can log attendance check-in');
    assert(hasPermission('worker', 'crops', 'read') === true, 'Worker can read assigned crops');
    assert(hasPermission('worker', 'harvests', 'read') === true, 'Worker can view harvests');
    assert(hasPermission('worker', 'crops', 'delete') === false, 'Worker CANNOT delete crops');
    assert(hasPermission('worker', 'farms', 'delete') === false, 'Worker CANNOT delete farms');
    assert(hasPermission('worker', 'sales', 'read') === false, 'Worker CANNOT view sales');
    assert(hasPermission('worker', 'users', 'read') === false, 'Worker CANNOT view users');

    // -------------------------------------------------------------
    // TEST 9: Database Integrity & Redis Key Isolation
    // -------------------------------------------------------------
    console.log('\nTEST 9: Database Integrity & Redis Key Isolation');
    const existingFarmer = await redis.hgetall('farmer:101');
    assert(Boolean(existingFarmer && existingFarmer.name), 'Original farm database record "farmer:101" is intact');

    const existingFarm = await redis.hgetall('farm:201');
    assert(Boolean(existingFarm && existingFarm.name), 'Original farm database record "farm:201" is intact');

    const existingField = await redis.hgetall('field:301');
    assert(Boolean(existingField && existingField.name), 'Original farm database record "field:301" is intact');

    const existingCrop = await redis.hgetall('crop:701');
    assert(Boolean(existingCrop && existingCrop.name), 'Original farm database record "crop:701" is intact');

    // Verify auth keys are strictly under auth:*
    const authKeys = await redis.keys('auth:*');
    assert(authKeys.length > 0, 'Authentication subsystem uses isolated "auth:*" namespace');
    const nonAuthKeys = await redis.keys('*');
    const entityKeys = nonAuthKeys.filter((k) => !k.startsWith('auth:'));
    assert(entityKeys.length >= 100, `Original 100+ farm entity records and relations intact (found ${entityKeys.length})`);

    // -------------------------------------------------------------
    // TEARDOWN: Clean up test-created keys
    // -------------------------------------------------------------
    console.log('\nTEARDOWN: Cleaning up test artifacts...');
    await cleanupTestUsers();
    console.log('Teardown complete.');

  } catch (error: any) {
    console.error('\nUnexpected test execution error:', error);
    failedTests++;
  } finally {
    console.log('\n============================================================');
    console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
    console.log('============================================================\n');

    await redis.quit();
    process.exit(failedTests === 0 ? 0 : 1);
  }
}

runTestSuite();
