/** Write uncompressed ZIP directly to disk, one PNG at a time.
 * Streaming keeps 4K sequences from accumulating hundreds of megabytes in JS.
 * ZIP bit 3 permits a data descriptor after each streamed member.
 */
type ZipSink = {
  write(data:Uint8Array):Promise<void>;
  close():Promise<void>;
  abort():Promise<void>;
};
const table=new Uint32Array(256);
for(let i=0;i<256;i++){
  let value=i;
  for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);
  table[i]=value>>>0;
}
const yieldTask=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
async function crc32(bytes:Uint8Array){
  let value=0xffffffff;
  for(let i=0;i<bytes.length;i++){
    value=table[(value^bytes[i])&255]^(value>>>8);
    if(i&&i%1048576===0)await yieldTask();
  }
  return (value^0xffffffff)>>>0;
}
function localHeader(name:Uint8Array){
  const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
  v.setUint32(0,0x04034b50,true);
  v.setUint16(4,20,true);
  v.setUint16(6,8,true); // data descriptor
  v.setUint16(8,0,true); // store compressed PNG unmodified
  v.setUint16(26,name.length,true);
  header.set(name,30);
  return header;
}
function centralHeader(name:Uint8Array,size:number,checksum:number,offset:number){
  const header=new Uint8Array(46+name.length),v=new DataView(header.buffer);
  v.setUint32(0,0x02014b50,true);
  v.setUint16(4,20,true);v.setUint16(6,20,true);
  v.setUint16(8,8,true); // descriptor mode
  v.setUint16(10,0,true);
  v.setUint32(16,checksum,true);
  v.setUint32(20,size,true);v.setUint32(24,size,true);
  v.setUint16(28,name.length,true);
  v.setUint32(42,offset,true);
  header.set(name,46);
  return header;
}
export class StreamingPngZip{
  private offset=0;
  private readonly central:Uint8Array[]=[];
  private closed=false;
  constructor(private readonly sink:ZipSink){}
  async add(name:string,bytes:Uint8Array){
    if(this.closed)throw new Error('El ZIP ya está cerrado');
    if(this.central.length>=65535)throw new Error('Demasiados archivos ZIP');
    const encoded=new TextEncoder().encode(name);
    if(encoded.length>65535||bytes.length>0xffffffff)throw new Error('Archivo demasiado grande para ZIP');
    const local=localHeader(encoded);
    const descriptor=new Uint8Array(16),v=new DataView(descriptor.buffer);
    const checksum=await crc32(bytes);
    v.setUint32(0,0x08074b50,true);
    v.setUint32(4,checksum,true);
    v.setUint32(8,bytes.length,true);
    v.setUint32(12,bytes.length,true);
    if(this.offset+local.length+bytes.length+descriptor.length>0xffffffff)throw new Error('Secuencia superior a 4 GB: divide la exportación');
    const before=this.offset;
    await this.sink.write(local);
    await this.sink.write(bytes);
    await this.sink.write(descriptor);
    this.central.push(centralHeader(encoded,bytes.length,checksum,before));
    this.offset+=local.length+bytes.length+descriptor.length;
  }
  async close(){
    if(this.closed)return;
    const centralStart=this.offset;
    for(const h of this.central){await this.sink.write(h);this.offset+=h.length}
    const centralSize=this.offset-centralStart;
    const end=new Uint8Array(22),e=new DataView(end.buffer);
    e.setUint32(0,0x06054b50,true);
    e.setUint16(8,this.central.length,true);e.setUint16(10,this.central.length,true);
    e.setUint32(12,centralSize,true);e.setUint32(16,centralStart,true);
    await this.sink.write(end);
    await this.sink.close();
    this.closed=true;
  }
  async abort(){if(!this.closed){this.closed=true;await this.sink.abort()}}
}
/** Must be called during a user click (before any await) to preserve browser activation. */
export async function openStreamingZip(filename:string):Promise<StreamingPngZip|null>{
  type Handle={createWritable:()=>Promise<ZipSink>};
  type Picker=(options:{suggestedName:string;types:{description:string;accept:Record<string,string[]>}[]})=>Promise<Handle>;
  const picker=(window as Window & {showSaveFilePicker?:Picker}).showSaveFilePicker;
  if(typeof picker!=='function')return null;
  const handle=await picker.call(window,{suggestedName:filename,types:[{description:'Secuencia PNG transparente (ZIP)',accept:{'application/zip':['.zip']}}]});
  return new StreamingPngZip(await handle.createWritable());
}
