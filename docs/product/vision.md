# Product vision

## 1. Start from the product
This workspace starts with one starter screen, account access and configuration. Define the real user's jobs before adding modules.

## 2. Shared data model
Extend `apps/web/src/data/graph.ts` with entity kinds, fields and links during MODEL. It starts with an empty entity list. The session graph is in memory until you choose persistence.

## 3. Navigation
The runtime measures M <600, TP 600-839, TL 840-1199, DS 1200-1599 and DW 1600+. The shell selects anatomy. Route content reads its own xp-slot container and never the viewport. Register modules once in app-modules.ts.

## 4. Design
Use theme roles, visible focus, labelled controls, and at least 44px targets on M and TP. Keep the component library and choose only the pieces the product needs.

## 5. Motion
Use the shared motion engine and easing tokens, honour reduced motion, and bind warmMotion once.

## 6. Evidence
Register every route and real state in src/qa/screens.ts. Build, typecheck, run unit and interaction tests, then run the unfiltered QA matrix and inspect its manifest and screenshots. No failed gate can be called complete.
