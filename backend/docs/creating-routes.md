# Creating a New API Route

This backend uses Hono with a small wrapper to wire validation and dependency injection.

## Steps

1. **Define route schemas (optional)**  
   Use Zod in `backend/src/api/routes` to validate params/query/body and expected responses.

2. **Create the route**  
   Add a file next to the others, export `createRoute({ method, path, schemas, handler })`.  
   The handler receives `{ c, service, docImporter, params?, query?, body? }`.

3. **Register the route**  
   Import and add it to the `routes` map in `backend/src/api/routes/index.ts`; it will be auto‑attached via `registerRoutes`.

4. **Use dependencies**  
   - `service` is the shared `DocsService` instance for DB operations.  
   - `docImporter` is the shared importer instance for pulling docs from external sources.  
   Both are injected once at app construction in `backend/src/index.ts`.

5. **Test it**  
   Add a route test under `backend/tests/routes`. Use `setupTestContext({ docImporter })` to supply a mock importer when needed.

This keeps route code small, typed, and testable without extra wiring in each handler.***
