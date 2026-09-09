# Create a project

Use the [xpresso_boilerplate skill](../../skills/xpresso_boilerplate/SKILL.md) to
create an independent workspace with the existing five device-class shell forms,
motion, themes, PWA and configurator.

From this Git checkout with Node 22+, pnpm 10 and Git:

```sh
scripts/create_project.sh my-workspace /absolute/parent/my-workspace --template aidesk
```

The destination must not exist. `aidesk` is the only supported profile and the
default when the flag is omitted. The default project is bare: Start, auth, Configure,
the kit library and an empty graph. `--with-demo` opts into the reference application,
never a product base. The isolated motion lab is omitted in both modes. No licensed template
source is copied. The generator uses tracked working-tree files and runs frozen
installation followed by a recursive build. It does not initialize Git or deploy.

The root package, Worker, shell brand, HTML and manifest receive the chosen name.
Internal `web` and `@xp/*` names stay intact. The new Worker has no inherited route
or zone; set its public origin in `apps/web/project.json` before generating final
PWA assets. `project.json` also records the source checkout and whether the demo was requested.
Local auth remains in memory. Bare projects omit reference screenshots and need their own icon.

Preview from the generated directory:

```sh
pnpm --filter web preview --host 127.0.0.1 --port 5231 --strictPort
```

Open `/?xp=M`, then TP/TL/DS/DW to inspect the forms. Stop the owned preview
when finished. Full instructions for creating, adding a screen, applying themes
and deploying are in [WORKFLOW.md](../../skills/xpresso_boilerplate/WORKFLOW.md);
package contracts are in [REFERENCE.md](../../skills/xpresso_boilerplate/REFERENCE.md).

For a repeatable packaging check, run these from the source checkout while the
generated preview is running on port 5231:

```sh
/opt/homebrew/bin/python3.12 scripts/test_create_project.py
node scripts/test_created_project.mjs /absolute/parent/my-workspace
# preview on another owned port: XP_BASE_URL=http://127.0.0.1:<port> node scripts/test_created_project.mjs /absolute/parent/my-workspace
```

The first checks destination guards plus real bare/demo generation. `XP_GENERATOR_FAST=1`
skips the two slow generation tests. It cleans its own temporary fixtures through
`trash`. The second checks identity, isolation and skill discovery, then renders
six routes in each of the five classes using the generated project's Chrome
driver. It closes only its own browser and leaves the preview to its owner.
