/** Store-only ZIP: PNG is already compressed. No external encoding service. */
export function pngZip(files:{name:string;bytes:Uint8Array}[]):Blob{
 const chunks:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0,centralSize=0;
 const encoder=new TextEncoder();
 const crc=(bytes:Uint8Array)=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0};
 for(const file of files){const name=encoder.encode(file.name),size=file.bytes.length,checksum=crc(file.bytes);
  const local=new Uint8Array(30+name.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,checksum,true);v.setUint32(18,size,true);v.setUint32(22,size,true);v.setUint16(26,name.length,true);local.set(name,30);
  chunks.push(local,file.bytes);
  const header=new Uint8Array(46+name.length),h=new DataView(header.buffer);h.setUint32(0,0x02014b50,true);h.setUint16(4,20,true);h.setUint16(6,20,true);h.setUint32(16,checksum,true);h.setUint32(20,size,true);h.setUint32(24,size,true);h.setUint16(28,name.length,true);h.setUint32(42,offset,true);header.set(name,46);central.push(header);centralSize+=header.length;offset+=local.length+size;
 }
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end] as BlobPart[],{type:'application/zip'});
}
