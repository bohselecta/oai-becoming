import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const dirs = [];
function collect(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name.startsWith("@")) {
      for (const sub of readdirSync(join(folder, entry.name)))
        add(join(folder, entry.name, sub));
    } else if (entry.isDirectory()) add(join(folder, entry.name));
  }
}
function add(dir) {
  if (existsSync(join(dir, "package.json"))) dirs.push(dir);
  if (existsSync(join(dir, "node_modules"))) collect(join(dir, "node_modules"));
}
collect("node_modules");
const packages = dirs
  .filter((p) => existsSync(join(p, "package.json")))
  .map((p) => ({
    dir: p,
    meta: JSON.parse(readFileSync(join(p, "package.json"), "utf8")),
  }))
  .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
const inventory = packages.map(({ dir, meta }) => {
  const licenses = readdirSync(dir).filter((n) =>
    /^(license|licence|copying|notice)(\.|$|-)/i.test(n),
  );
  return {
    name: meta.name,
    version: meta.version,
    license: meta.license || "UNSPECIFIED",
    noticeFiles: licenses,
  };
});
writeFileSync(
  "docs/dependency-inventory.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
let notices =
  "Third-party dependency notices — generated from installed lockfile packages.\nThese grants cover only their own material, not Becoming original material.\n\n";
for (const { dir, meta } of packages) {
  notices += `\n=== ${meta.name} ${meta.version} (${meta.license || "UNSPECIFIED"}) ===\n`;
  const names = readdirSync(dir).filter((n) =>
    /^(license|licence|copying|notice)(\.|$|-)/i.test(n),
  );
  for (const name of names)
    notices += `\n${name}\n${readFileSync(join(dir, name), "utf8")
      .replaceAll("\r\n", "\n")
      .replace(/[ \t]+$/gm, "")}\n`;
  if (!names.length)
    notices +=
      "No top-level notice file packaged. Review package metadata and upstream terms before redistribution.\n";
}
writeFileSync("docs/THIRD-PARTY-NOTICES.txt", notices);
console.log(
  `Recorded ${inventory.length} installed dependency packages and their available notices.`,
);
