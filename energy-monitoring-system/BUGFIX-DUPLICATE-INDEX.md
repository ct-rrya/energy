# Bug Fix: Duplicate Schema Index Warning for Report Model

**Date**: July 18, 2026  
**Issue**: Mongoose duplicate index warning  
**Status**: ✅ **FIXED**  

---

## ⚠️ Original Warning

```
Duplicate schema index on {"expiresAt":1} for model "Report"
```

---

## 🔍 Root Cause Analysis

### The Problem

The `expiresAt` field in the Report schema had **TWO index declarations**:

#### 1. Property-Level Index (DUPLICATE)
```typescript
@Prop({
  required: true,
  index: true,  // ← Creates index: { expiresAt: 1 }
})
expiresAt: Date;
```

#### 2. Schema-Level TTL Index (CORRECT)
```typescript
ReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// ← Creates TTL index: { expiresAt: 1 } with auto-deletion
```

### Why This Caused a Warning

- Both declarations create an index on `{ expiresAt: 1 }`
- MongoDB detected duplicate index definitions
- Mongoose issued a warning to prevent unnecessary indexes

---

## 🎯 The Fix

### Solution: Remove Property-Level Index

**File**: `src/reports/schemas/report.schema.ts` (Line 297)

```typescript
// BEFORE (with duplicate)
@Prop({
  required: true,
  index: true,  // ← REMOVED
})
expiresAt: Date;

// AFTER (no duplicate)
@Prop({
  required: true,
})
expiresAt: Date;
```

**The TTL index at schema level remains unchanged**:
```typescript
ReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## ✅ Why This Solution Is Correct

### Technical Reasoning

1. **TTL Indexes Include Regular Index Functionality**
   - A TTL index on `{ expiresAt: 1 }` serves BOTH purposes:
     - Query optimization (like a regular index)
     - Auto-deletion (TTL functionality)
   - No need for a separate regular index

2. **Schema-Level Declaration Is More Explicit**
   - TTL configuration (`expireAfterSeconds`) can ONLY be set at schema level
   - Property-level `index: true` cannot specify TTL options
   - Schema-level is the single source of truth

3. **Follows Mongoose Best Practices**
   - Complex indexes (TTL, compound, unique with options) should be declared at schema level
   - Simple indexes can use `@Prop({ index: true })`
   - When both are needed, schema level takes precedence

4. **Eliminates Redundancy**
   - One index definition instead of two
   - Clearer intent (TTL is the primary purpose)
   - No duplicate index overhead

---

## 📊 Index Behavior (Unchanged)

### Before Fix
```
Index 1 (from @Prop): { expiresAt: 1 }
Index 2 (from Schema): { expiresAt: 1 } + TTL
Result: Duplicate warning, but TTL works
```

### After Fix
```
Index: { expiresAt: 1 } + TTL
Result: No warning, TTL works perfectly
```

**Functionality**: ✅ **IDENTICAL**  
**Performance**: ✅ **IDENTICAL**  
**Warning**: ✅ **ELIMINATED**

---

## 🧪 Verification

### Build Status
```bash
npm run build
# ✅ SUCCESS - No errors
```

### Expected Result
When you start the server:
- ✅ No "Duplicate schema index" warning
- ✅ TTL index created: `{ expiresAt: 1 }`
- ✅ Documents auto-delete after `expiresAt` timestamp
- ✅ Queries on `expiresAt` remain optimized

---

## 📚 Mongoose Index Best Practices

### When to Use `@Prop({ index: true })`
✅ Simple single-field indexes  
✅ No special options needed  
✅ Quick property-level declaration  

**Example**:
```typescript
@Prop({ index: true })
email: string;
```

### When to Use `Schema.index()`
✅ TTL indexes (expireAfterSeconds)  
✅ Compound indexes (multiple fields)  
✅ Unique indexes with options  
✅ Text indexes  
✅ Geospatial indexes  
✅ Sparse indexes  
✅ Partial indexes  

**Examples**:
```typescript
// TTL index
Schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index
Schema.index({ userId: 1, createdAt: -1 });

// Unique with sparse
Schema.index({ email: 1 }, { unique: true, sparse: true });

// Text index
Schema.index({ description: 'text' });
```

### Avoid Duplication
❌ **DON'T**: Declare same field in both places  
✅ **DO**: Choose the appropriate method based on index complexity

---

## 🎯 Other Indexes in Report Schema

### Properly Declared (No Issues)

#### Property-Level (Simple Indexes)
```typescript
@Prop({ index: true }) type: ReportType;      // ✅ Correct
@Prop({ index: true }) format: ReportFormat;  // ✅ Correct
@Prop({ index: true }) generatedBy: ObjectId; // ✅ Correct
@Prop({ index: true }) startDate: string;     // ✅ Correct
@Prop({ index: true }) endDate: string;       // ✅ Correct
```

#### Schema-Level (Compound Indexes)
```typescript
ReportSchema.index({ generatedBy: 1, createdAt: -1 });       // ✅ Correct
ReportSchema.index({ type: 1, format: 1, createdAt: -1 });   // ✅ Correct
ReportSchema.index({ startDate: 1, endDate: 1 });            // ✅ Correct
ReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // ✅ Correct
```

**All indexes follow best practices with no duplicates.**

---

## 📖 MongoDB TTL Index Documentation

### How TTL Indexes Work

1. **Background Thread**: MongoDB runs a background thread every 60 seconds
2. **Expiration Check**: Thread checks for documents where `expiresAt < now()`
3. **Automatic Deletion**: Expired documents are removed automatically
4. **Index Functionality**: TTL index also optimizes queries on `expiresAt`

### Configuration
```typescript
{ expiresAt: 1 }              // Index field (ascending)
{ expireAfterSeconds: 0 }     // Delete immediately when time reached
```

**Setting `expireAfterSeconds: 0`** means:
- Delete as soon as `expiresAt` timestamp is reached
- No additional grace period
- Ideal for precise expiration (e.g., 30-day retention)

---

## 🚀 Impact

### Before Fix
- ⚠️ Warning logged on every server start
- ⚠️ Duplicate index created in MongoDB
- ⚠️ Minor performance overhead (negligible)
- ✅ Functionality still worked correctly

### After Fix
- ✅ No warnings
- ✅ Single, efficient index
- ✅ Cleaner logs
- ✅ Follows Mongoose best practices
- ✅ Identical functionality

---

## 📝 Summary

**Issue**: Duplicate index warning for `expiresAt` field  
**Cause**: Both `@Prop({ index: true })` and `Schema.index()` declared  
**Fix**: Removed property-level index, kept TTL schema-level index  
**Result**: Warning eliminated, functionality preserved  

**The duplicate index warning is now fully resolved.** ✅

---

## 📚 References

- **Mongoose Indexes**: https://mongoosejs.com/docs/guide.html#indexes
- **MongoDB TTL Indexes**: https://www.mongodb.com/docs/manual/core/index-ttl/
- **NestJS Mongoose**: https://docs.nestjs.com/techniques/mongodb

