import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
test('expanded walkthrough keeps chapter links, active step count and menu controls aligned',()=>{
 const nav=html.split('id="walkthrough-chapters"')[1].split('</nav>')[0];
 const hashes=[...nav.matchAll(/href="(#[^"]+)"/g)].map(m=>m[1]);
 function node(){const attrs=new Map(),handlers=new Map();return {children:[],attrs,handlers,textContent:'',innerHTML:'',append(...x){this.children.push(...x);},setAttribute(k,v){attrs.set(k,v);},removeAttribute(k){attrs.delete(k);},toggleAttribute(k){if(attrs.has(k)){attrs.delete(k);return false;}attrs.set(k,'');return true;},addEventListener(k,f){handlers.set(k,f);},focus(){this.focused=true;}};}
 const nodes=new Map();const get=k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);};
 const links=hashes.map(hash=>({...node(),hash,textContent:hash}));let observe;
 runInNewContext(readFileSync(new URL('../web/walkthrough.js',import.meta.url),'utf8'),{
  document:{querySelector:get,querySelectorAll:()=>links,createElement:node},
  window:{matchMedia:()=>({addEventListener(){}})},IntersectionObserver:class{constructor(fn){observe=fn;}observe(){}},
 });
 const sections=get('#story-chapters').children;
 assert.equal(sections.length,10);assert.equal(links.length,sections.length);
 sections.forEach((s,i)=>{assert.equal('#'+s.id,hashes[i]);assert.match(s.innerHTML,new RegExp('Step '+(i+1)+' of 10'));});
 observe([{isIntersecting:true,target:sections[9]}]);
 assert.equal(links[9].attrs.get('aria-current'),'location');
 assert.match(get('#chapter-menu-toggle').textContent,/Step 10 of 10/);
 assert.equal(links[0].attrs.has('aria-current'),false);
 get('#chapter-menu-toggle').handlers.get('click')();
 assert.equal(get('#chapter-menu-toggle').attrs.get('aria-expanded'),'true');
 get('#walkthrough-chapters').handlers.get('keydown')({key:'Escape'});
 assert.equal(get('#chapter-menu-toggle').attrs.get('aria-expanded'),'false');
});
test('Blog chapter anchors resolve without colliding with application screen routes',()=>{
 const screens=new Set([...html.matchAll(/data-screen="([^"]+)"/g)].map(m=>m[1]));
 const anchors=[...html.split('aria-label="Article sections"')[1].split('</aside>')[0].matchAll(/href="\/blog#([^"]+)"/g)].map(m=>m[1]);
 assert.equal(anchors.length,8);
 for(const id of anchors){assert.ok(html.includes('id="'+id+'"'));assert.equal(screens.has(id),false,'screen collision '+id);}
});
