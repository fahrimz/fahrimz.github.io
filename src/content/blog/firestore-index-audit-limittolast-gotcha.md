---
title: 'Firestore Index Auditing and the limitToLast Gotcha'
description: 'How to audit Firestore composite indexes against your codebase queries, and why limitToLast silently requires a different index direction.'
pubDate: 'Apr 13 2026'
---

Firestore composite indexes are easy to forget about until you hit a runtime error. Here's how to systematically audit them, and a subtle gotcha with `limitToLast()` that can catch you off guard.

<br />

#### When Do You Need a Composite Index?

Firestore automatically creates single-field indexes. You need a **composite index** when a query combines:

- `.where()` on one field + `.orderBy()` on a different field
- Multiple `.where()` clauses on different fields
- Inequality operators (`!=`, `<`, `>`, etc.) combined with other filters or ordering

<br />

#### Auditing: Repo Indexes vs Production

If you manage indexes as JSON files in your repo (which you should), periodically compare them against what's actually deployed.

<br />

**Step 1:** Export current production indexes:

```bash
firebase use your-production-project
firebase firestore:indexes > current_prod.json
```

<br />

**Step 2:** Compare each index in your repo files against `current_prod.json`. Match by `collectionGroup`, `queryScope`, and all `fields` (fieldPath + order/arrayConfig).

<br />

**Step 3:** Check for discrepancies:

- **Missing in prod**: indexes defined in repo but not deployed — these need to be deployed
- **Extra in prod**: indexes in prod but not in repo — these may be orphaned

<br />

#### Auditing: Codebase Queries vs Index Files

Search your codebase for all Firestore queries that might need composite indexes:

```bash
# Find composite query candidates
grep -rn "\.where\(" --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -rn "\.orderBy\(" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

<br />

For each query that combines `.where()` with `.orderBy()` (on different fields), verify a matching composite index exists in your index files.

<br />

#### The limitToLast Gotcha

This is the subtle one. Consider this query:

```typescript
collection
  .where("type", "in", ["paid", "order"])
  .orderBy("createdAt", "asc")
  .limitToLast(20);
```

<br />

You might think this needs an index with `type ASC + createdAt ASC`. But it actually needs `type ASC + createdAt DESC`.

<br />

**Why?** `limitToLast()` works by **reversing the query direction internally**. Firestore actually executes:

```
.where("type", "in", ["paid", "order"])
.orderBy("createdAt", "desc")   // ← flipped!
.limit(20)
```

<br />

Then the SDK reverses the results back to ascending order on the client side.

<br />

So if your index only has `createdAt ASC`, you'll get a runtime error asking you to create a composite index. The Firestore error will include a URL with the correct index definition — but the URL is a base64-encoded protobuf that might not render correctly if copied from device logs or screenshots.

<br />

**How to decode the URL:** The `create_composite` parameter is a base64-encoded protobuf. You can decode it to see the exact fields and directions:

```bash
echo 'BASE64_STRING_HERE' | base64 -d | xxd
```

<br />

Look for the human-readable field names in the hex dump. The direction bytes tell you ASC (01) or DESC (02).

<br />

#### Fix

Add both index variants if your codebase uses both `limit()` and `limitToLast()`:

```json
{
  "indexes": [
    {
      "collectionGroup": "MESSAGES",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "MESSAGES",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

<br />

#### Tip: __name__ in Indexes

You might see `__name__` in Firestore index definitions. Firestore implicitly appends `__name__` as a tiebreaker to every composite index. Adding it explicitly creates a technically different index that behaves identically at query time. If your repo has `__name__` but production doesn't (or vice versa), deploying will create duplicate indexes. Keep them consistent — generally, omit `__name__` and let Firestore handle it implicitly.
