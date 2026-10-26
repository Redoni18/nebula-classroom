// Adds a staff account to the admin, or sets a new password for one that
// exists (nobody can sign up on the site: SPEC step 2).
//
//   corepack pnpm admin:add -- --email ana@example.com --name "Ana"            (local database)
//   corepack pnpm admin:add -- --email ana@example.com --name "Ana" --remote   (the live database)
//
// It asks for the password without showing it (or reads ADMIN_PASSWORD), hashes
// it with Better Auth's own function, and writes the rows with wrangler.

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { hashPassword } from "better-auth/crypto";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const email = flag("email")?.trim().toLowerCase();
const name = flag("name")?.trim();
const remote = args.includes("--remote");
if (!email || !name || !email.includes("@")) {
  console.error('Usage: corepack pnpm admin:add -- --email <email> --name "<name>" [--remote]');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) process.stdout.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

// Asking needs a real terminal; without one (Claude Code's "!" commands, CI) the
// question could never be answered.
if (!process.env.ADMIN_PASSWORD && !process.stdin.isTTY) {
  console.error("No terminal to type the password into: run this in a Terminal window, or set ADMIN_PASSWORD.");
  process.exit(1);
}
const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Password (10+ characters): "));
if (password.length < 10) {
  console.error("The password needs at least 10 characters.");
  process.exit(1);
}

const sql = (value) => `'${String(value).replace(/'/g, "''")}'`;
const id = () => randomBytes(16).toString("hex");
const now = new Date().toISOString();
const hash = await hashPassword(password);
const userId = id();

// New address: a user and its password. Known address: the name and password change.
const statements = [
  `insert into "user" (id, name, email, emailVerified, createdAt, updatedAt) values (${sql(userId)}, ${sql(name)}, ${sql(email)}, 1, ${sql(now)}, ${sql(now)}) on conflict(email) do update set name = excluded.name, updatedAt = excluded.updatedAt`,
  `delete from account where providerId = 'credential' and userId = (select id from "user" where email = ${sql(email)})`,
  `insert into account (id, accountId, providerId, userId, password, createdAt, updatedAt) select ${sql(id())}, id, 'credential', id, ${sql(hash)}, ${sql(now)}, ${sql(now)} from "user" where email = ${sql(email)}`,
  // Signed-in sessions end, so a changed password takes effect everywhere.
  `delete from session where userId = (select id from "user" where email = ${sql(email)})`,
];

execFileSync(
  "node_modules/.bin/wrangler",
  ["d1", "execute", "nebula-classroom", remote ? "--remote" : "--local", "--command", statements.join("; ")],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`${email} can sign in at /admin (${remote ? "live" : "local"} database).`);
