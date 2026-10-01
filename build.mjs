import{mkdir,cp,copyFile,writeFile}from'node:fs/promises';
const assets=[
['https://mcps-invoice-v10-test.vercel.app/assets/invoice-template.jpg','invoice-template.jpg'],
['https://mcps-invoice-v10-test.vercel.app/assets/continuation-template.jpg','continuation-template.jpg'],
['https://mcps-invoice-v10-test.vercel.app/assets/app-icon.jpg','app-icon.jpg']];
await mkdir('dist/assets',{recursive:true});
await cp('mcps-invoice-test','dist/mcps-invoice-test',{recursive:true});
await copyFile('index.html','dist/index.html');
await copyFile('manifest.webmanifest','dist/manifest.webmanifest');
await copyFile('sw.js','dist/sw.js');
for(const[url,name]of assets){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${name}: ${r.status}`);await writeFile(`dist/assets/${name}`,Buffer.from(await r.arrayBuffer()))}
console.log('MCPS invoice v10 test build complete');