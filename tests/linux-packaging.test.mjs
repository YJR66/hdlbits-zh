import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const config = JSON.parse(read('electron-builder.linux.json'));
const pkg = JSON.parse(read('package.json'));

test('Linux builds keep AppImage/deb and add x64 RPM with a dedicated command', () => {
  assert.deepEqual(config.linux.target.map(t => t.target), ['AppImage', 'deb', 'rpm']);
  assert.ok(config.linux.target.every(t => t.arch.length === 1 && t.arch[0] === 'x64'));
  assert.match(pkg.scripts['desktop:linux'], /--linux AppImage deb rpm --x64/);
  assert.match(pkg.scripts['desktop:linux:rpm'], /--linux rpm --x64/);
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('RPM uses host library capabilities and does not export private compiler libraries', () => {
  assert.ok(config.rpm.depends.includes('glibc >= 2.35'));
  assert.ok(config.rpm.depends.includes('libgtk-3.so.0()(64bit)'));
  assert.ok(config.rpm.depends.includes('libnss3.so()(64bit)'));
  assert.ok(config.rpm.fpm.includes('--no-rpm-autoreqprov'));
  assert.ok(config.rpm.fpm.includes('_build_id_links none'));
  assert.ok(!config.rpm.depends.some(d => /iverilog|readline|libc6|libgtk-3-0/.test(d)));
});

test('RPM owns its launcher and sandbox helper with explicit permissions', () => {
  assert.ok(config.rpm.fpm.includes('desktop/linux/hdlbits-zh.sh=/usr/bin/hdlbits-zh'));
  assert.ok(config.rpm.fpm.includes('755,root,root:/usr/bin/hdlbits-zh'));
  assert.ok(config.rpm.fpm.includes('4755,root,root:/opt/HDLBits/chrome-sandbox'));
  assert.match(read('desktop/linux/hdlbits-zh.sh'), /exec \/opt\/HDLBits\/hdlbits-zh "\$@"/);
});

test('RPM lifecycle scripts preserve user data and skip old-version upgrade removal', () => {
  for (const name of [config.rpm.afterInstall, config.rpm.afterRemove]) {
    const script = read(name);
    assert.ok(!script.includes('\r'), name + ' must use LF');
    assert.match(script, /update-desktop-database/);
    assert.match(script, /gtk-update-icon-cache/);
    assert.doesNotMatch(script, /\b(rm|unlink|chmod|chown)\b|--no-sandbox/);
  }
  assert.match(read(config.rpm.afterRemove), /if \[ "\$\{1:-0\}" -ne 0 \]; then\n    exit 0/);
});

test('RPM scriptlets refresh caches on install/remove, but not upgrade postun', {skip: process.platform !== 'linux'}, t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hdlbits-rpm-scriptlets-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const log = path.join(dir, 'calls');
  for (const command of ['update-desktop-database', 'gtk-update-icon-cache']) {
    const file = path.join(dir, command);
    fs.writeFileSync(file, '#!/bin/sh\nprintf "%s\\n" "$0 $*" >> "$CACHE_TEST_LOG"\nexit 1\n');
    fs.chmodSync(file, 0o755);
  }
  const run = (name, argument, commands = dir) => {
    const result = spawnSync('/bin/sh', [fileURLToPath(new URL('../' + name, import.meta.url)), argument], {
      env: {...process.env, PATH: commands, CACHE_TEST_LOG: log}, encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
  };
  run(config.rpm.afterInstall, '1');
  run(config.rpm.afterInstall, '2');
  const installed = fs.readFileSync(log, 'utf8');
  assert.equal(installed.trim().split('\n').length, 4);
  run(config.rpm.afterRemove, '1');
  assert.equal(fs.readFileSync(log, 'utf8'), installed);
  run(config.rpm.afterRemove, '0');
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 6);
  // Cache utilities are optional, and their absence/failure must not break RPM.
  run(config.rpm.afterInstall, '1', path.join(dir, 'missing'));
  run(config.rpm.afterRemove, '0', path.join(dir, 'missing'));
});
