import{mkdir,cp,copyFile,writeFile}from'node:fs/promises';
const assets=[
['https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-9ae0-81f7-9701-bbab55137148/raw?se=2026-10-01T17%3A05%3A28Z&sp=r&sv=2026-02-06&sr=b&scid=9839dd90-3ff3-5404-bbd6-76cfa2483e3e&skoid=de71a0d5-fb02-4fce-be69-9296aced242b&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-10-01T16%3A44%3A41Z&ske=2026-10-02T16%3A44%3A41Z&sks=b&skv=2026-02-06&sig=tk%2BNziTDoBK99x1iGciPywybwYWHvAf9ptQBCcMSrbk%3D','invoice-template.jpg'],
['https://sdmntprcentralus.oaiusercontent.com/files/00000000-e4cc-81f5-b026-70cb28f28ce8/raw?se=2026-10-01T17%3A05%3A35Z&sp=r&sv=2026-02-06&sr=b&scid=c76d2eae-2231-50c9-a31e-a1250e535aa2&skoid=de71a0d5-fb02-4fce-be69-9296aced242b&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-10-01T15%3A48%3A19Z&ske=2026-10-02T15%3A48%3A19Z&sks=b&skv=2026-02-06&sig=uhu%2Bx2C9FSNBf98kcWexkoWjNLJChiMPhtvRhN07Ydo%3D','continuation-template.jpg'],
['https://sdmntprcentralus.oaiusercontent.com/files/00000000-7db8-81f5-868a-834c5ed72503/raw?se=2026-10-01T17%3A05%3A41Z&sp=r&sv=2026-02-06&sr=b&scid=ee5dcd8a-23fd-5c5d-8eb5-3791acb76c5e&skoid=de71a0d5-fb02-4fce-be69-9296aced242b&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-10-01T16%3A21%3A42Z&ske=2026-10-02T16%3A21%3A42Z&sks=b&skv=2026-02-06&sig=teD7NXMNLbxubXzyDIgBq6WroOIU4MQznqT9/YHrXzY%3D','app-icon.jpg']];
await mkdir('dist/assets',{recursive:true});
await cp('mcps-invoice-test','dist/mcps-invoice-test',{recursive:true});
await copyFile('index.html','dist/index.html');
await copyFile('manifest.webmanifest','dist/manifest.webmanifest');
await copyFile('sw.js','dist/sw.js');
for(const[url,name]of assets){const r=await fetch(url);if(!r.ok)throw new Error(`${name}: ${r.status}`);await writeFile(`dist/assets/${name}`,Buffer.from(await r.arrayBuffer()))}
console.log('MCPS invoice v10 test build complete');