# ADMIN ACCESS CODE IMPLEMENTATION PLAN

## EXECUTIVE SUMMARY

This document outlines the implementation of shared-workstation administrator authentication for EcoStep using individual access codes, 10-minute inactivity timeout, and comprehensive audit logging.

## CURRENT ARCHITECTURE ANALYSIS

### Existing Authentication
- ✅ NestJS + JWT infrastructure exists
- ✅ bcrypt password hashing exists
- ✅ UsersService with findByEmail
- ✅ JwtStrategy and guards exist
- ✅ User schema with role, isActive, lastLoginAt

### What Can Be Reused
1. **JWT Infrastructure** - Keep existing JwtModule and JwtStrategy
2. **bcrypt** - Use for access code hashing
3. **User Schema** - Extend with accessCodeHash field
4. **Guards** - Enhance existing guards for role-based access
5. **UsersService** - Extend with access code methods

## IMPLEMENTATION PHASES

### PHASE 1: DATABASE SCHEMA UPDATES

#### 1.1 Update User Schema
```typescript
// Add to user.schema.ts
@Prop({
  required: false,
  select: false,
})
accessCodeHash?: string;

@Prop({
  type: String,
  enum: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PUBLIC_USER'],
  default: 'SYSTEM_ADMIN',
})
role: string;

@Prop()
lastActivityAt?: Date;
```

#### 1.2 Create AuditLog Schema
```typescript
// New file: src/audit/schemas/audit-log.schema.ts
@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, index: true })
  administratorId: string;

  @Prop({ required: true })
  administratorName: string;

  @Prop({ required: true })
  action: string;

  @Prop()
  target?: string;

  @Prop({ type: Object })
  details?: Record<string, any>;

  @Prop({ required: true })
  result: string;

  @Prop({ required: true })
  timestamp: Date;
}
```

### PHASE 2: BACKEND IMPLEMENTATION

#### 2.1 Access Code Authentication Service
- Generate secure access codes (12-character alphanumeric)
- Hash codes with bcrypt
- Validate codes against hashes
- Create JWT with admin identity

#### 2.2 Admin Management Module (SUPER_ADMIN only)
- Create administrator accounts
- Generate access codes
- Reset access codes
- Activate/deactivate accounts
- View administrator list

#### 2.3 Audit Logging Service
- Log authentication events
- Log administrator actions
- Associate actions with admin ID
- Query audit logs

#### 2.4 Role-Based Guards
- @Roles('SYSTEM_ADMIN') decorator
- @Roles('SUPER_ADMIN') decorator
- RolesGuard implementation
- Protect endpoints appropriately

### PHASE 3: FRONTEND IMPLEMENTATION

#### 3.1 Access Code Login Page
```
/admin/access-code
- Input: Access code (masked)
- Button: Continue
- Error: "Invalid administrator access code"
```

#### 3.2 Inactivity Timer Context
```typescript
// InactivityContext.tsx
- Track user activity events
- 10-minute countdown
- 9-minute warning modal
- Auto-logout on expiration
- API token invalidation
```

#### 3.3 Admin Identity Display
```typescript
// Show in navigation/header:
"Signed in as: [Name]"
"SYSTEM ADMIN"
[Switch Administrator]
```

#### 3.4 Administrator Management Page (SUPER_ADMIN)
```
/admin/management
- List administrators
- Create administrator
- Show generated code once
- Reset access codes
- Activate/deactivate
```

### PHASE 4: SESSION MANAGEMENT

#### 4.1 Activity Tracking
- Mouse/keyboard events → reset timer
- Navigation → reset timer
- Button clicks → reset timer
- Background polling → DON'T reset timer

#### 4.2 Warning Modal (9 minutes)
```
"Session Expiring"
"Your session will end in 60 seconds"
[Continue Session] [Log Out Now]
```

#### 4.3 Auto Logout (10 minutes)
- Clear auth state
- Clear tokens
- Redirect to access code page
- Show: "Session ended due to inactivity"

## FILE CHANGES REQUIRED

### Backend Files to Create
1. `src/audit/audit.module.ts`
2. `src/audit/audit.service.ts`
3. `src/audit/audit.controller.ts`
4. `src/audit/schemas/audit-log.schema.ts`
5. `src/audit/dto/create-audit-log.dto.ts`
6. `src/admin-management/admin-management.module.ts`
7. `src/admin-management/admin-management.service.ts`
8. `src/admin-management/admin-management.controller.ts`
9. `src/admin-management/dto/create-admin.dto.ts`
10. `src/admin-management/dto/reset-access-code.dto.ts`
11. `src/auth/dto/access-code-login.dto.ts`
12. `src/auth/guards/roles.guard.ts`
13. `src/auth/decorators/roles.decorator.ts`

### Backend Files to Modify
1. `src/users/schemas/user.schema.ts` - Add accessCodeHash, update roles
2. `src/users/users.service.ts` - Add findByAccessCode, updateAccessCode
3. `src/auth/auth.service.ts` - Add validateAccessCode, loginWithAccessCode
4. `src/auth/auth.controller.ts` - Add POST /auth/admin/access-code
5. `src/app.module.ts` - Import AuditModule, AdminManagementModule

### Frontend Files to Create
1. `src/contexts/InactivityContext.tsx`
2. `src/features/auth/pages/AdminAccessCodePage.tsx`
3. `src/features/admin-management/pages/AdminManagementPage.tsx`
4. `src/features/admin-management/components/AdminList.tsx`
5. `src/features/admin-management/components/CreateAdminModal.tsx`
6. `src/features/admin-management/components/AccessCodeDisplay.tsx`
7. `src/features/audit/pages/AuditLogPage.tsx`
8. `src/components/common/SessionWarningModal.tsx`
9. `src/hooks/useInactivityTimer.ts`

### Frontend Files to Modify
1. `src/contexts/AuthContext.tsx` - Add admin identity, inactivity handling
2. `src/routes/index.tsx` - Add admin routes, protect by role
3. `src/components/layout/Navigation.tsx` - Show admin identity, switch button
4. `src/App.tsx` - Wrap with InactivityProvider

## SECURITY CHECKLIST

- [ ] Access codes never stored in plaintext
- [ ] Access codes never logged
- [ ] Access codes never in API responses
- [ ] bcrypt hashing for codes (same as passwords)
- [ ] JWT expiration configured appropriately
- [ ] Role guards on all protected endpoints
- [ ] Rate limiting on access code endpoint
- [ ] Generic error messages (no enumeration)
- [ ] Session invalidation on timeout
- [ ] Background activity doesn't reset timer
- [ ] Multi-tab logout synchronization

## TEST SCENARIOS

### Backend Tests
```bash
# Test access code generation
npm run test src/admin-management/admin-management.service.spec.ts

# Test access code authentication
npm run test src/auth/auth.service.spec.ts

# Test role guards
npm run test src/auth/guards/roles.guard.spec.ts

# Test audit logging
npm run test src/audit/audit.service.spec.ts
```

### Frontend Tests
```bash
# Test inactivity timer
npm test src/hooks/useInactivityTimer.test.ts

# Test access code login
npm test src/features/auth/pages/AdminAccessCodePage.test.tsx

# Test session warning
npm test src/components/common/SessionWarningModal.test.tsx
```

### Manual Test Cases
- TC-01: Valid access code login
- TC-02: Invalid access code
- TC-03: Inactive administrator
- TC-04: Admin action attribution
- TC-05: Administrator switch
- TC-06: Inactivity warning
- TC-07: Continue session
- TC-08: Automatic timeout
- TC-09: Background activity doesn't reset
- TC-10: Role-based authorization
- TC-11: Super admin account creation
- TC-12: Access code reset
- TC-13: Account deactivation
- TC-14: Expired session API request

## DATABASE MIGRATIONS

```javascript
// Migration 001: Update existing users with new fields
db.users.updateMany(
  {},
  {
    $set: {
      role: 'SYSTEM_ADMIN',
      accessCodeHash: null,
      lastActivityAt: null
    }
  }
);

// Migration 002: Create super admin account
// Run via seed script with environment variable
```

## ENVIRONMENT VARIABLES

```env
# Add to .env
JWT_ACCESS_TOKEN_EXPIRATION=15m
SESSION_INACTIVITY_TIMEOUT=600000  # 10 minutes in ms
SESSION_WARNING_TIME=540000         # 9 minutes in ms
```

## API ENDPOINTS

### Authentication
- POST `/auth/admin/access-code` - Login with access code
- POST `/auth/admin/switch` - Switch administrator

### Admin Management (SUPER_ADMIN only)
- GET `/admin-management/administrators` - List all admins
- POST `/admin-management/administrators` - Create admin
- PATCH `/admin-management/administrators/:id/status` - Activate/deactivate
- POST `/admin-management/administrators/:id/reset-code` - Reset access code

### Audit Logs (SYSTEM_ADMIN, SUPER_ADMIN)
- GET `/audit/logs` - Query audit logs
- GET `/audit/logs/:adminId` - Get admin-specific logs

## DEPLOYMENT CHECKLIST

- [ ] Run database migrations
- [ ] Create initial SUPER_ADMIN account securely
- [ ] Update JWT expiration settings
- [ ] Configure session timeout environment variables
- [ ] Deploy backend with new endpoints
- [ ] Deploy frontend with new pages
- [ ] Test access code login end-to-end
- [ ] Test inactivity timeout
- [ ] Test role-based access
- [ ] Test audit logging
- [ ] Verify public routes still work
- [ ] Document super admin credentials securely

## ROLLBACK PLAN

If issues occur:
1. Revert backend to previous version
2. Revert frontend to previous version
3. Database schema is backward compatible (new fields are optional)
4. Existing email/password auth still works as fallback

## NEXT STEPS

Due to the complexity and file count, I recommend implementing in this order:

1. **Backend Phase 1**: Schema updates + Audit logging (2-3 files)
2. **Backend Phase 2**: Access code auth service (2-3 files)
3. **Backend Phase 3**: Admin management endpoints (3-4 files)
4. **Frontend Phase 1**: Access code login page (1-2 files)
5. **Frontend Phase 2**: Inactivity timer (2-3 files)
6. **Frontend Phase 3**: Admin management UI (3-4 files)
7. **Integration Testing**: End-to-end tests
8. **Security Audit**: Review all endpoints and auth flows

Would you like me to proceed with implementing Phase 1 (Schema Updates + Audit Logging)?
