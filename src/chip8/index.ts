import fontset from './fontset';

export default class Chip8 {
    private static MEMORY_SIZE = 4096;
    private static REGISTER_COUNT = 16;
    private static GRAPGICS_WIDTH = 64;
    private static GRAPGICS_HEIGHT = 32;

    private static GRAPHICS_MEMORY = Chip8.GRAPGICS_WIDTH * Chip8.GRAPGICS_HEIGHT;
    private static STACK_SIZE = 16;
    private static KEY_COUNT = 16;

    public drawFlag: boolean = false;

    public I: number = 0;
    public pc: number = 0;
    public sp: number = 0;

    private delay: number = 0;
    private sound: number = 0;
    
    public stack: Uint16Array;
    public memory: Uint8Array;
    public V: Uint8Array;
    public keys: Uint8Array;

    private gfx: Uint8Array;

    public constructor()
    {
        this.memory = new Uint8Array(Chip8.MEMORY_SIZE);
        this.V = new Uint8Array(Chip8.REGISTER_COUNT);
        this.gfx = new Uint8Array(Chip8.GRAPHICS_MEMORY);
        this.stack = new Uint16Array(Chip8.STACK_SIZE);
        this.keys = new Uint8Array(Chip8.KEY_COUNT);

        this.gfx.fill(0);
    }

    public init(): void {
        this.pc = 0x200;
        this.I = 0;
        this.sp = 0;
        
        this.gfx.fill(0);
        this.memory.fill(0);
        this.keys.fill(0);

        for (let i = 0; i < 80; i++) {
            this.memory[i] = fontset[i];
        }

        this.delay = 0;
        this.sound = 0;
    }

    public loadGame(buffer: Uint8Array): void
    {
        for (let i = 0; i < buffer.length; i++) {
            this.memory[i + 0x200] = buffer[i];
        }
    }

    public tick(): void {
        this.drawFlag = false;

        // Fetch Opcode
        const opcode = ((this.memory[this.pc]) << 8) | (this.memory[this.pc + 1]);
    
        console.log(opcode.toString(16));

        const nnn = opcode & 0x0FFF;
        const   n = opcode & 0x000F;
        const  kk = opcode & 0x00FF;
        const   x = (opcode & 0x0F00) >> 8;
        const   y = (opcode & 0x00F0) >> 4;

        // Decode Opcode
        switch (opcode & 0xF000)
        {
            case 0x0000:
                switch (opcode & 0x000f) {
                    case 0x0000: // 00E0 - CLS: Clear the display
                        this.gfx.fill(0);
                        this.drawFlag = true;
                        break;
                    case 0x000E: // 00EE - RET: return from subroutine
                        this.pc = this.stack[--this.sp];
                        break;
                    default:
                        console.error(`Unknown opcode ${opcode}`);
                }
                break;
            case 0x1000: // 1nnn - JP addr Jump to location NNN
                this.pc = nnn;
                this.pc -= 2;
                break;
            case 0x2000: //2nnn - CALL addr: Call subroutine at NNN
                this.stack[this.sp] = this.pc;
                this.sp++;
                this.pc = nnn;
                
                // we do not want to increase pc this tick
                this.pc -= 2;
                break;
            case 0x3000: // 3xkk - SE Vx, byte: Skip next instruction if Vx = kk
                if (this.V[x] === kk) 
                {
                    this.pc += 2;
                }
                break;
            case 0x4000: // 4xkk - SNE Vx, byte: Skip next instruction if Vx != k
                if (this.V[x] !== kk) 
                {
                    this.pc += 2;
                }
                break;
            case 0x5000: // 5xy0 - SE Vx, Vy: Skip next instruction if Vx = Vy
                const Vx = this.V[x];
                const Vy = this.V[y];

                if (Vx === Vy) {
                    this.pc += 2;
                }
                break;
            case 0x6000: // 6xkk - LD Vx, byte: Put value kk into register Vx
                this.V[x] = kk;
                break;
            case 0x7000: // ADD Vx, byte: Add the value kk to the value of register Vx, then stores the result in Vx
                this.V[x] += kk;
                break;
            case 0x8000: 
                switch (opcode & 0x000F) {
                    case 0x0000: // 8xy0 - LD Vx, Vy: Stores the value of Vy in Vx
                        this.V[x] = this.V[y];
                        break;
                    case 0x0001: // 8xy1 - OR Vx, Vy: Sets Vx = Vx OR Vy
                        this.V[x] |= this.V[y];
                        break;
                    case 0x0002: // 8xy2 - AND Vx, Vy: Set Vx = Vx AND Vy
                        this.V[x] &= this.V[y];
                        break;
                    case 0x0003: // 8xy3 - XOR Vx, Vy: Set Vx = Vx XOR Vy
                        this.V[x] ^= this.V[y];
                        break;
                    case 0x0004: { // 8xy4 - ADD Vx, Vy: Set Vx = Vx + Vy, set VF = carry 
                        const res = this.V[x] + this.V[y];
                        this.V[0xF] = res > 255 ? 1 : 0;

                        // Make sure we are still in ushort range
                        this.V[x] = res & 0x0FFF;
                        break;
                    }
                    case 0x0005:
                        this.V[0xF] = this.V[y] > this.V[x] ? 0 : 1;
                        
                        this.V[x] -=this.V[y];

                        // Make sure we are still in ushort range
                        this.V[x] &= 0x0FFF;
                        break;
                    case 0x0006:
                        this.V[0xF] = this.V[x] & 0x1;
                        this.V[x] >>= 1;
                        break;
                    case 0x0007:
                        this.V[0xF] = this.V[x] > this.V[y] ? 0 : 1;                        
                        this.V[x] = this.V[y] - this.V[x];

                        this.V[x] &= 0x0FFF;
                        break;
                    case 0x000E:
                        this.V[0xF] = this.V[x] >> 7;

                        this.V[x] <<= 1;
                        break;
                    default:
                        console.error(`Opcode not found ${opcode}`);
                }
                break;
            case 0x9000: 
                if (this.V[x] !== this.V[y]) {
                    this.pc += 2;
                }
                break;
            case 0xA000:
                this.I = nnn;
                break;
            case 0xB000:
                this.pc = nnn + this.V[0];
                break;
            case 0xC000: {
                const random = (Math.random()*255)|0;

                this.V[x] = random & (opcode & kk);
                break;
            }
            case 0xD000: {
                const coord_x = this.V[x];
                const coord_y = this.V[y];

                const height = opcode & 0x000F;

                this.V[0xF] = 0;

                let collision = false;

                for (let line = 0; line < height; line++) {
                    collision =  collision || this.drawByte(coord_x, coord_y+line, this.memory[this.I + line]);
                }
                
                this.drawFlag = true;

                if (collision) {
                    this.V[0xF] = 1;
                }
                
                break;
            }
            case 0xE000: 
                switch(opcode & 0x00FF) {
                    case 0x009E:
                        if (this.keys[this.V[x]] !== 0) {
                            this.pc += 2;
                        }
                        break;
                    case 0x00A1:
                        if (this.keys[this.V[x]] === 0) {
                            this.pc += 2;
                        }
                        break;
                    default:
                        console.error(`Opcode not found ${opcode}`);
                }
                break;
            case 0xF000:
                switch (opcode & 0x00FF) {
                    case 0x0007:
                        this.V[x] = this.delay;        
                        break;
                    case 0x000A:
                        // TODO: implement interrupt
                        this.pc -= 2;
                        break;
                    case 0x0015:
                        this.delay = this.V[x];
                        break;
                    case 0x0018:
                        this.sound = this.V[x];
                        break;
                    case 0x001E:
                        if (this.I + this.V[x] > 0xFFF) {
                            this.V[0xF] = 1;
                        } else {
                            this.V[0xF] = 0;
                        }

                        this.I += this.V[x];
                        this.I &= 0xFFF; 
                        break;
                    case 0x0029:
                        this.I = this.V[(opcode & 0x0F00) >> 8] * 0x5;
                        break;
                    case 0x0033: {                        
                        this.memory[this.I] = (this.V[x] % 1000) / 100;
                        this.memory[this.I + 1] = (this.V[x] % 100 ) / 10;
                        this.memory[this.I + 2] = (this.V[x] % 10);

                        break;
                    }
                    case 0x0055:
                        for (let i = 0; i <= x; i++) {
                            this.memory[this.I + i] = this.V[i];
                        }

                        this.I += x + 1;
                        break;
                    case 0x0065:
                        for (let i = 0; i <= x; i++) {
                            this.V[i] = this.memory[this.I+i];
                        }

                        this.I += x + 1;
                        break;
                    default:
                        console.error(`Opcode not found ${opcode}`);
                        
                }
                break;
            default:
                console.error(`${opcode} is not understood by this emulator`);
        }

        this.pc += 2;

        // Update timers
        if (this.delay > 0) {
            this.delay--;
        }

        if (this.sound > 0) {
            if (this.sound == 1) {
                console.log("BEEP");
                this.sound--;
            }
        }
    }

    //#region Internal Methods
    private drawByte(x: number, y: number, byte: number): boolean
    {
        let collision = false;
        let b = byte;

        for (let i = 0x8; i >= 0x0; i--) {

            collision = this.setPixel(x + i, y, b & 0x1);
            b = b >> 1;
        }

        return collision;
    }

    private setPixel(x: number, y: number, bit: number): boolean
    {
        const pixel = y * Chip8.GRAPGICS_WIDTH + x;
        const current = this.gfx[pixel];

        this.gfx[pixel] ^= bit;

        return current === 0x1 && this.gfx[pixel] === 0x0;
    }
    //#endregion
    
    //#region Helpe Methods
    public getGraphicsMemory(): Uint8Array
    {
        return this.gfx;
    }
    //#endregion
}
// TODO: implement reverse lookup of sprite
// TODO: implement reverse lookup of sprite
