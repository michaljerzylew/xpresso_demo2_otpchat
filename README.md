# xpresso_demo2_otpchat

A bare workspace with a starter screen, six local authentication screens, the configurator, the component library, seven packages, theme, motion and QA. No product modules, records or reference screenshots are included.

Build your app from its own model. Register each module in `apps/web/src/app-modules.ts`, add its routes and QA entries. The entity vocabulary starts in `apps/web/src/data/graph.ts`. Local authentication is an in-memory fixture; it sends no email and resets on reload.

Start with [the skill](skills/xpresso_boilerplate/SKILL.md) and [workflow A](skills/xpresso_boilerplate/WORKFLOW.md).
Source checkout: `/Users/mjl/lampa/projects/cc_xpresso_boilerplate`. The demo is at `/Users/mjl/lampa/projects/cc_xpresso_boilerplate` and at xs_boilerplate.milkies.work.
The source path and bare mode are recorded in `apps/web/project.json`.

```sh
pnpm -r build
pnpm --filter web typecheck
pnpm -r test
pnpm qa first-run
pnpm --filter web preview --host 127.0.0.1 --port 5231 --strictPort
```

Use an unused port; 5231 is an example.

Set `deployOrigin` before deploying and replace the starter icon with your identity. No Git repository or remote was created.
