import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const script = read('src/main.js');
const heroScene = read('src/hero-scene.js');
const pkg = JSON.parse(read('package.json'));

const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
};

for (const section of ['statement', 'approach', 'work', 'about']) {
  assert(html.includes(`id="${section}"`), `Missing #${section} section`);
}

for (const project of ['meridian', 'foundry', 'careline', 'vector']) {
  assert(html.includes(`data-project="${project}"`), `Missing concept card: ${project}`);
  assert(script.includes(`${project}:`), `Missing concept data: ${project}`);
}

assert(html.includes('NOVA/FORM'), 'Missing NOVA/FORM identity');
assert(html.includes('FORM') && html.includes('FUNCTION'), 'Missing FORM × FUNCTION hero');
assert(script.includes('novaform-theme'), 'Theme storage key must use standalone identity');
assert(script.includes("dispatchEvent(new CustomEvent('novaform:theme'"), 'Theme event must use standalone identity');
assert(heroScene.includes("addEventListener('novaform:theme'"), 'WebGL scene must use standalone theme event');
assert(pkg.name === 'nova-form-studio', 'Package must use public project name');
assert(html.includes('Fictional concept studies'), 'Site must clearly distinguish concept work from client work');

if (!process.exitCode) {
  console.log('NOVA/FORM self-check passed: identity, concept content, theme runtime, and public-demo routing are valid.');
}
