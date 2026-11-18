import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const compiled=JSON.parse(readFileSync('out/TheRecordV2.sol/TheRecordV2.json','utf8'));
const source=readFileSync('contracts/TheRecordV2.sol');
const artifact={contract:'TheRecordV2',compiler:'0.8.28',sourceSha256:createHash('sha256').update(source).digest('hex'),abi:compiled.abi,bytecode:compiled.bytecode.object,runtime:compiled.deployedBytecode.object};
if(!artifact.bytecode.startsWith('0x')||artifact.bytecode.length<100||!artifact.runtime.startsWith('0x'))throw Error('Compile TheRecordV2 with Foundry first.');
writeFileSync('deploy/withdrawal-v2-artifact.json',JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({sourceSha256:artifact.sourceSha256,creationBytes:(artifact.bytecode.length-2)/2,runtimeBytes:(artifact.runtime.length-2)/2}));
