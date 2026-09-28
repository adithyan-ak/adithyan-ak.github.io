import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Use Mermaid CLI 11.4.2 and its Puppeteer peer, locally or via module-path overrides.
const { renderMermaid } = await import(process.env.MERMAID_CLI_MODULE || '@mermaid-js/mermaid-cli');
const { default: puppeteer } = await import(process.env.PUPPETEER_MODULE || 'puppeteer');
const source = path.resolve('content/diagrams/agent-name-collision');
const output = path.resolve('public/images/posts');
const mermaidConfig = JSON.parse(await readFile(path.join(source, 'mermaid-config.json'), 'utf8'));
const backgroundColor = '#f7f4ed';
const names = ['routing-comparison', 'implementation-patterns', 'defense-lifecycle'];
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, ...(process.env.MERMAID_CHROME ? { executablePath: process.env.MERMAID_CHROME } : {}) });
try {
  for (const name of names) {
    const stem = `agent-name-collision-${name}`;
    const definition = await readFile(path.join(source, `${stem}.mmd`), 'utf8');
    const options = { mermaidConfig, backgroundColor, viewport: { width: 1800, height: 900, deviceScaleFactor: 2 } };
    const svg = await renderMermaid(browser, definition, 'svg', options);
    await writeFile(path.join(source, `${stem}.svg`), svg.data);
    const png = await renderMermaid(browser, definition, 'png', options);
    const target = path.join(output, `${stem}.png`);
    await sharp(png.data).extend({ top: 48, bottom: 48, left: 48, right: 48, background: backgroundColor }).png().toFile(target);
    const meta = await sharp(target).metadata();
    if (meta.width <= meta.height) throw new Error(`${stem} must be landscape`);
    console.log(`${stem}: ${meta.width} x ${meta.height}`);
  }
} finally {
  await browser.close();
}
