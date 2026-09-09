function adjacencyOf(manifest) {
  return manifest.adjacency ?? {};
}

function intersects(left = [], right = []) {
  const rightSet = new Set(right);
  return left.find((item) => rightSet.has(item));
}

export function validatePageAssembly(manifests) {
  const suppressed = [];
  const suppressedParts = [];
  const suppressedNames = new Set();

  for (const manifest of manifests) {
    const suppresses = adjacencyOf(manifest).suppressesWhenPresent ?? [];
    const reason = manifests
      .filter((other) => other !== manifest)
      .map((other) => intersects(suppresses, adjacencyOf(other).exposes))
      .find(Boolean);
    if (reason) {
      suppressedNames.add(manifest.name);
      suppressed.push({ name: manifest.name, because: reason });
    }
    for (const rule of adjacencyOf(manifest).suppressesPartsWhenPresent ?? []) {
      const partReason = manifests
        .filter((other) => other !== manifest)
        .map((other) => intersects(rule.capabilities, adjacencyOf(other).exposes))
        .find(Boolean);
      if (partReason) suppressedParts.push({ name: manifest.name, part: rule.part, because: partReason });
    }
  }

  const active = manifests.filter((manifest) => !suppressedNames.has(manifest.name));
  const errors = [];
  const owners = new Map();
  for (const manifest of active) {
    for (const capability of adjacencyOf(manifest).exposes ?? []) {
      const names = owners.get(capability) ?? [];
      names.push(manifest.name);
      owners.set(capability, names);
    }
  }
  for (const [capability, names] of owners) {
    if (names.length > 1) errors.push({ rule: "duplicate-exposure", capability, modules: names });
  }

  for (let leftIndex = 0; leftIndex < active.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < active.length; rightIndex += 1) {
      const left = active[leftIndex];
      const right = active[rightIndex];
      const leftConflicts = adjacencyOf(left).conflictsWith ?? [];
      const rightConflicts = adjacencyOf(right).conflictsWith ?? [];
      const conflict = [
        leftConflicts.includes(right.name) ? right.name : null,
        rightConflicts.includes(left.name) ? left.name : null,
        intersects(leftConflicts, adjacencyOf(right).exposes),
        intersects(rightConflicts, adjacencyOf(left).exposes),
      ].find(Boolean);
      if (conflict) errors.push({ rule: "conflict", capability: conflict, modules: [left.name, right.name] });
    }
  }

  return {
    valid: errors.length === 0,
    active: active.map(({ name }) => name),
    suppressed,
    suppressedParts,
    errors,
  };
}
