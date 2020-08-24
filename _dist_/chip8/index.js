import b from"./fontset.js";export default class i{constructor(){this.drawFlag=!1,this.I=0,this.pc=0,this.sp=0,this.delay=0,this.sound=0,this.memory=new Uint8Array(i.MEMORY_SIZE),this.V=new Uint8Array(i.REGISTER_COUNT),this.gfx=new Uint8Array(i.GRAPHICS_MEMORY),this.stack=new Uint16Array(i.STACK_SIZE),this.keys=new Uint8Array(i.KEY_COUNT),this.gfx.fill(0)}init(){this.pc=512,this.I=0,this.sp=0,this.gfx.fill(0),this.memory.fill(0),this.keys.fill(0);for(let t=0;t<80;t++)this.memory[t]=b[t];this.delay=0,this.sound=0}loadGame(t){for(let a=0;a<t.length;a++)this.memory[a+512]=t[a]}tick(){this.drawFlag=!1;const t=this.memory[this.pc]<<8|this.memory[this.pc+1];console.log(t.toString(16));const a=t&4095,c=t&15,r=t&255,s=(t&3840)>>8,e=(t&240)>>4;switch(t&61440){case 0:switch(t&15){case 0:this.gfx.fill(0),this.drawFlag=!0;break;case 14:this.pc=this.stack[--this.sp];break;default:console.error(`Unknown opcode ${t}`)}break;case 4096:this.pc=a,this.pc-=2;break;case 8192:this.stack[this.sp]=this.pc,this.sp++,this.pc=a,this.pc-=2;break;case 12288:this.V[s]===r&&(this.pc+=2);break;case 16384:this.V[s]!==r&&(this.pc+=2);break;case 20480:const V=this.V[s],l=this.V[e];V===l&&(this.pc+=2);break;case 24576:this.V[s]=r;break;case 28672:this.V[s]+=r;break;case 32768:switch(t&15){case 0:this.V[s]=this.V[e];break;case 1:this.V[s]|=this.V[e];break;case 2:this.V[s]&=this.V[e];break;case 3:this.V[s]^=this.V[e];break;case 4:{const h=this.V[s]+this.V[e];this.V[15]=h>255?1:0,this.V[s]=h&4095;break}case 5:this.V[15]=this.V[e]>this.V[s]?0:1,this.V[s]-=this.V[e],this.V[s]&=4095;break;case 6:this.V[15]=this.V[s]&1,this.V[s]>>=1;break;case 7:this.V[15]=this.V[s]>this.V[e]?0:1,this.V[s]=this.V[e]-this.V[s],this.V[s]&=4095;break;case 14:this.V[15]=this.V[s]>>7,this.V[s]<<=1;break;default:console.error(`Opcode not found ${t}`)}break;case 36864:this.V[s]!==this.V[e]&&(this.pc+=2);break;case 40960:this.I=a;break;case 45056:this.pc=a+this.V[0];break;case 49152:{const h=Math.random()*255|0;this.V[s]=h&(t&r);break}case 53248:{const h=this.V[s],k=this.V[e],f=t&15;this.V[15]=0;let n=!1;for(let o=0;o<f;o++)n=n||this.drawByte(h,k+o,this.memory[this.I+o]);this.drawFlag=!0,n&&(this.V[15]=1);break}case 57344:switch(t&255){case 158:this.keys[this.V[s]]!==0&&(this.pc+=2);break;case 161:this.keys[this.V[s]]===0&&(this.pc+=2);break;default:console.error(`Opcode not found ${t}`)}break;case 61440:switch(t&255){case 7:this.V[s]=this.delay;break;case 10:this.pc-=2;break;case 21:this.delay=this.V[s];break;case 24:this.sound=this.V[s];break;case 30:this.I+this.V[s]>4095?this.V[15]=1:this.V[15]=0,this.I+=this.V[s],this.I&=4095;break;case 41:this.I=this.V[(t&3840)>>8]*5;break;case 51:{this.memory[this.I]=this.V[s]%1e3/100,this.memory[this.I+1]=this.V[s]%100/10,this.memory[this.I+2]=this.V[s]%10;break}case 85:for(let h=0;h<=s;h++)this.memory[this.I+h]=this.V[h];this.I+=s+1;break;case 101:for(let h=0;h<=s;h++)this.V[h]=this.memory[this.I+h];this.I+=s+1;break;default:console.error(`Opcode not found ${t}`)}break;default:console.error(`${t} is not understood by this emulator`)}this.pc+=2,this.delay>0&&this.delay--,this.sound>0&&(this.sound==1&&(console.log("BEEP"),this.sound--))}drawByte(t,a,c){let r=!1,s=c;for(let e=8;e>=0;e--)r=this.setPixel(t+e,a,s&1),s=s>>1;return r}setPixel(t,a,c){t=t%i.GRAPGICS_WIDTH,a=a%i.GRAPGICS_HEIGHT;const r=a*i.GRAPGICS_WIDTH+t,s=this.gfx[r];return this.gfx[r]^=c,s===1&&this.gfx[r]===0}getGraphicsMemory(){return this.gfx}}i.MEMORY_SIZE=4096,i.REGISTER_COUNT=16,i.GRAPGICS_WIDTH=64,i.GRAPGICS_HEIGHT=32,i.GRAPHICS_MEMORY=i.GRAPGICS_WIDTH*i.GRAPGICS_HEIGHT,i.STACK_SIZE=16,i.KEY_COUNT=16;