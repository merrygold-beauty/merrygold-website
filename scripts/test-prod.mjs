// Runs the production-build suite (tests/prod). Sets MG_TARGET here because an
// inline VAR=value prefix does not work in every shell this project is run from.
// Extra arguments pass straight through, for example: npm run test:prod -- --headed
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, MG_TARGET: 'prod' }
});

process.exit(result.status ?? 1);
