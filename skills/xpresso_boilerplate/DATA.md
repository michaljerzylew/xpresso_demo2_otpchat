# DATA.md: the data law

**Read in full at MODEL, before you write a component.** An app is its data model wearing an
interface. A model chosen while writing the third screen produces a product that has to be rebuilt,
and the person paying for that rebuild is the operator.

The rules here are the application form of
`human-data-and-assets-relationship-and-role-modeling`. They apply whether the data lives in memory,
in SQLite, in D1, in Postgres or in MySQL.

## 1. Law

1. **The model describes the domain, never the app's own machinery.** No tables or types for runs,
   imports, sync state, quality scores or migration bookkeeping in the product model.
2. **One entity is one kind of thing.** "Each record is one ___" must complete in one plain sentence,
   and that sentence goes in the type's doc comment. If it needs "and", you have two entities.
3. **Nothing stands alone.** One connected graph. A new entity either links into it or does not get
   created. Link at the right level: a fact shared by a whole group belongs to the group, not copied
   onto every member.
4. **Every fact lives in exactly one place.** Every other appearance is computed. A value typed in
   two places will disagree, and the disagreement will be discovered by a user.
5. **Derive mechanically.** Slugs, references, codes and totals are composed by formula from the
   layer above, in readable words, never by hand. Nothing derivable is stored.
6. **Every link is a named role, in both directions.** Not `links`, not `parentId` when it can be
   `reportsToId`. A bare relationship name is a defect.
7. **Closed lists are enumerations**, not free text. Free text is the last resort, for genuinely free
   content.
8. **A pair that carries data is its own entity, named for the fact** (`Booking`, `Membership`,
   `Assignment` only if assignment itself has attributes), never a junction called `Link`.
9. **Human-readable everywhere.** The display name of a record is a name, never an id. Ids are
   opaque and never shown as the primary label.
10. **Split until no fact is stored twice and no field changes meaning per record, then stop.** A
    split that kills no duplication is complexity for its own sake.

## 2. The backbone

Find the domain's spine before creating anything. Almost every domain has this shape:

**IDENTITY** (who we are: the workspace, its brands, its markets) → **ACTORS AND RESOURCES** (people,
teams, stock, files, devices) → **BASE THINGS** (what we offer or produce) → **VARIANTS**
(base thing plus attribute values) → **TRANSACTIONS** (what happened: bookings, orders, tickets,
issues) → **PROJECTIONS** (what the app shows: calendars, reports, dashboards, feeds).

**TAXONOMIES** (collections, categories, segments, tags) hang off the layers by links, never inline.

HARBOR's own graph is the worked example, twenty entity kinds in `apps/web/src/data/harbor.ts:4`
**of the source checkout** (`apps/web/project.json` → `source`; a bare project does not carry it):
`person, package, booking, reservation, table, order, menuItem, product, stock, conversation,
ticket, article, collection, agent, issue, project, team, view, event, report`. Read how they link
before modelling your own: it is the cheapest tour of a real graph you will get. In your project the
vocabulary lives in `apps/web/src/data/graph.ts`, generated with one placeholder kind and an empty
`entities` array; MODEL rewrites that file before the first component, and the graph engine
(`apps/web/src/data/session-graph.ts`, `apps/web/src/data/session-store.tsx`) reads its types from it.

**One idea worth stealing outright:** `event` is a projection, not a source. Anything with a date
projects into the calendar; the calendar owns no truth of its own. Do the same for whatever surface
your app aggregates into (a feed, a report, a queue).

## 3. Shape of an entity in this codebase

Every entity in the demo graph shares one shape (`apps/web/src/data/harbor.ts:6`):

```ts
type Entity<K extends EntityKind> = { kind: K; id: string; title: string; links: EntityRef[] };
export type EntityRef = { kind: EntityKind; id: string };
```

- `kind` plus `id` is the address. `kind:id` is also the record route segment, resolved by
  `resolveGraphEntity` (`apps/web/src/data/session-graph.ts:7`).
- `title` is the human name. Every record has one, and it is what the UI shows.
- `links` is the graph. Typed both ways: writing a link writes the inverse.

Keep this shape for your entities. It is what makes cross-module links, the record resolver, the
inspector's linked-entity list and the assistant's source cards work without per-module code.

## 4. One store, one write path

**Read the contract before writing a mutation:** `apps/web/src/data/harbor-session.ts:7-17` in the
source checkout. A bare project ships the engine and no mutation surface, because it ships no
entities: your app writes its own store against the engine, in the shape below, and registers the
hook the shell subscribes to as `session.useSession` in `apps/web/src/app-modules.ts`. The demo's
Work module keeps its projection adapter beside the module (`modules/work/session.tsx` in the
source), which is the pattern for a store a single module owns.

```ts
let revision = 0;
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const publish = () => { revision++; listeners.forEach(listener => listener()); };
export function useHarborSession() { useSyncExternalStore(subscribe, snapshot, snapshot); }
export const sessionTime = graphNow;
```

The rules that follow from it, and they are not optional:

- **A component subscribes with the hook and reads the graph directly.** `useHarborSession()`
  returns nothing: it subscribes the component to the revision counter, and the component then reads
  the module-scope graph singleton. Both halves are required, and a component that reads without
  subscribing will show stale data after someone else's write.
- **Every mutation is a function in the store, and every mutation ends in `publish()`.** A write that
  does not publish leaves half the app showing stale data.
- **Component state never holds domain data.** It holds drafts, selection and open or closed. The
  moment a value must survive navigation, it belongs in the store. Every module review in this
  repository found this defect at least once.
- **One clock.** `sessionTime` exists so a saved change is never older than a seed. Do not call
  `Date.now()` in a mutation.
- **A write that also changes relationships updates both sides.** `updateRecord`
  (`apps/web/src/data/harbor-session.ts:19`) is the worked example: reassigning a ticket removes the old assignee's
  link and adds the new one on both records.
- **One publish per complete transaction, never per field.** The store states it at
  `apps/web/src/data/harbor-session.ts:182`: publish one complete graph transaction, never a
  partially updated relationship. A compound write (`completeBooking`, `:137`) validates, prices,
  writes the booking, the event, the payment and the reservation, and publishes once at the end.
- **A module with write logic but no state of its own gets a facade**, not its own store:
  `apps/web/src/modules/venue/session.ts:5`.
- **A deferred write reads current state at commit time.** A write that closed over a list captured
  when an animation started will silently overwrite a change made during that animation. This exact
  defect shipped and was caught by a suite: `LEARNINGS.md`.

The source repository carries two mechanisms. A bare project ships only the second; the first is
the demo's pattern, read in the source checkout (`apps/web/src/data/harbor-session.ts`,
`apps/web/src/modules/venue/session.ts`, `docs/product/modules/work.md` and the `App.tsx` line below
are source paths). Pick one per app
rather than mixing them over the same entities:

| Store | Contract | Used by | Choose it when |
|---|---|---|---|
| `apps/web/src/data/harbor-session.ts` | mutates the seeded singleton in place, publishes a revision integer through `useSyncExternalStore` | inbox, offers, venue | writes are direct field edits on records that already exist |
| `apps/web/src/data/session-graph.ts` with `apps/web/src/data/session-store.tsx` | an immutable graph in React state; every write runs a reconciliation pass that rebuilds derived relationships and throws on a missing link target (`:15`, `:23`) | work, and kit reads it | writes create or re-parent records whose relationships must stay consistent |

`SessionGraphProvider` is mounted above the whole route tree (`apps/web/src/App.tsx:108` in the
source, `:21` in a bare project), which is why graph state survives client-side navigation. Nothing survives a reload.

The reason the second one exists is written down in `docs/product/modules/work.md:51`: a separate
mutable issue array made progress disagree with project links and hid reassigned issues. That is the
failure mode a reconciling store prevents, and the reason "every mutation goes through one store" is
a rule and not a preference.

## 5. Persistence

The boilerplate ships an in-memory graph and no backend. That is a deliberate starting point, not a
limitation to hide from the operator: state your choice in the ledger and in the report.

| Target | When | What it means here |
|---|---|---|
| **In memory** (as shipped) | demos, prototypes, anything where a reload may reset | Seed data in `apps/web/src/data/*.ts`, mutations in the session store. Nothing survives a reload. Say so |
| **Per-viewer local** | preferences, drafts, one-device tools | `localStorage` behind one typed module, never scattered. Wrap every read and write in try/catch and render correctly with no stored value |
| **Cloudflare D1** | the app already deploys to Workers and wants server truth with no extra infrastructure | Add the binding to `wrangler.toml`, put SQL in a migrations directory, and access it only in `apps/web/src/worker.ts` behind an explicit route prefix |
| **SQLite (local or embedded)** | single-node tools, desktop-like apps, offline-first with sync later | Same schema discipline as D1; keep the file path in configuration, never in source |
| **Postgres / MySQL** | multi-user products, reporting, anything with real integrity needs | Schema with real foreign keys, named constraints, indexes on every foreign key and every column you filter or sort by |

**Whatever the target, the schema obeys §1.** Concretely:

- One table per entity, named for the thing in the domain's own words, singular concept, plural table
  name only if the codebase already does that.
- A surrogate primary key, plus a unique constraint on the natural key that actually identifies the
  thing to a human.
- Every relationship is a foreign key with a role-bearing name (`assignee_id`, not `user_id_2`) and
  an index.
- A pair that carries data is its own table named for the fact, with its own attributes and a unique
  constraint on the pair.
- Closed lists are an enumerated type or a lookup table with a stable code, never free text.
- Derived values are computed in a view or at read time. Store a derived value only with a stated
  reason and a mechanism that keeps it correct.
- Timestamps: `created_at` and `updated_at` on every table, UTC, set by the database.
- Money is an integer of the smallest unit plus a currency code. Never a float.
- Soft delete only where restore is a product feature, and then it is a real field with an index, not
  a convention.
- Migrations are files, ordered, forward-only, checked in. A schema change with no migration file
  does not exist.

**The boundary, and the two things that will actually stop you.**

1. **The Content Security Policy refuses cross-origin traffic.** `apps/web/src/csp.ts:19` sets
   `connect-src 'self'` and `:23` sets `img-src 'self' data:`. Every cross-origin API, auth provider,
   analytics endpoint and remote image is blocked by the browser until you widen the directive, and
   widening it means re-deriving the hashes (`pnpm --filter web csp:hashes`). Same-origin under the
   Worker needs no change, and `run_worker_first = true` already routes every request through it, so
   the cheapest correct design is: the page talks only to its own origin, and the Worker talks to the
   world.
2. **There are no bindings yet.** `apps/web/wrangler.toml` is thirteen lines with exactly one
   binding, `ASSETS`. No D1, KV, R2 or Durable Objects. Adding one is a config change plus a
   deployment permission conversation, not a code detail: name it in the ledger before you build on
   it.

Server access lives in the Worker (`apps/web/src/worker.ts`), never in a component. Secrets come
from the environment, never from a file in the repository and never from a log.

**What exists today, verified rather than assumed:** two `fetch(` call sites in all of
`apps/web/src`, both in the Worker serving assets; zero uses of `sessionStorage`, `indexedDB` or
`document.cookie` anywhere in the app, the packages or the scripts; `localStorage` used only for the
theme mode, the configurator state and two dismissal flags. The URL is the deliberate carrier of
shareable state.

## 6. Demo data is part of the product

The seed data is what the operator and every reviewer will judge the app by. Cheap seed data makes a
premium interface look like a template.

- Realistic names, amounts, dates and text in the app's own voice and language. No lorem ipsum, no
  `Test User 1`, no `foo`.
- Volumes that exercise the design: enough records that a list scrolls, that a filter can return
  nothing, that a table needs sorting, that a calendar has a busy day and an empty one.
- Deterministic ids and timestamps, so captures are stable and a diff means something.
- Cross-links populated, so every detail screen's inspector has something real to show and the
  cross-module links land somewhere.
- Every state reachable from the data: an empty collection, a failed payment, an overdue item, a
  conflict. If a state cannot be produced from the seed, its screen cannot be captured, and an
  uncaptured state is an unshipped state.

## 7. The QA data contract

A state exists only if the harness can produce it.

1. Register the screen and its states in `apps/web/src/qa/screens.ts`.
2. Write the producer in your module's state file (`scripts/qa/<module>-states.mjs`, named by the
   module's `qaStates` registration in `apps/web/src/app-modules.ts`; `scripts/qa/common.mjs` is the
   generic dispatcher and handles only `default`, `sheet-open`, `panel-open` and the `?state=`
   family): navigate, perform the interaction that creates the state, wait for a settled signal.
   Derive values from the graph, never hardcode a seeded literal: a producer that typed a fixed email
   address broke the moment the graph generated addresses from names. The demo's producers are the
   worked example, `scripts/qa/harbor-states.mjs` in the source checkout.
3. Producers open the surface the class actually has: on TP the module sheet from the title, on M the
   dock's More tab, on the wide classes the anchored menu.
4. A visual replacement keeps the harness contract the old element carried, `data-kit-state` included.

## 8. Model gate

Before leaving the MODEL phase, every line must be true.

- [ ] Every entity has its one-sentence "each record is one ___" written down.
- [ ] Every fact has exactly one home. Facts stored twice: 0.
- [ ] Every link has a role name in both directions. Bare relationship names: 0.
- [ ] Every closed list is an enumeration. Free-text fields holding a closed list: 0.
- [ ] Every derived value has a formula and is not stored, or has a stated reason and a mechanism.
- [ ] Entities that link to nothing: 0, or documented as deliberately standalone.
- [ ] The persistence target is chosen and written in the ledger, with what survives a reload.
- [ ] Every screen in the surface matrix can be served by this model. Screens needing a field the
      model does not have: 0.
- [ ] Seed data exists for every state in the matrix. Unproducible states: 0.
