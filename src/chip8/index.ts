export default class Chip8 {
    private static MEMORY_SIZE = 4096;
    private static REGISTER_COUNT = 16;
    private static GRAPGICS_WIDTH = 64;
    private static GRAPGICS_HEIGHT = 32;

    private static GRAPHICS_MEMORY = Chip8.GRAPGICS_WIDTH * Chip8.GRAPGICS_HEIGHT;
    private static STACK_SIZE = 16;
    private static KEY_COUNT = 16;

    public drawFlag: boolean = false;

    private I: number = 0;
    private pc: number = 0;
    private sp: number = 0;

    private delay: number = 0;
    private sound: number = 0;
    
    private stack: Uint16Array;
    private memory: Uint8Array;
    private register: Uint8Array;
    private keys: Uint8Array;

    private gfx: Uint8Array;

    public constructor()
    {
        this.memory = new Uint8Array(Chip8.MEMORY_SIZE);
        this.register = new Uint8Array(Chip8.REGISTER_COUNT);
        this.gfx = new Uint8Array(Chip8.GRAPHICS_MEMORY);
        this.stack = new Uint16Array(Chip8.STACK_SIZE);
        this.keys = new Uint8Array(Chip8.KEY_COUNT);

        this.gfx.fill(0);
    }

    public init(): void {
        this.pc = 0x200;
        this.I = 0;
        this.sp = 0;
        
        this.memory.fill(0);

        // Load Fontset

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
        const opcode = ((this.memory[this.pc]|0) << 8) | (this.memory[this.pc + 1]|0);
        
        // Decode Opcode
        switch (opcode & 0xF000)
        {
            case 0x0000:
                switch (opcode & 0x000f) {
                    case 0x0000:
                        this.gfx.fill(0);
                        this.drawFlag = true;
                        break;
                    case 0x000E:
                        this.sp--;
                        this.pc = this.stack[this.sp];
                        break;
                }
            case 0x1000:
                this.pc = opcode & 0x0FFF;
                this.pc -= 2;
                break;
            case 0x2000:
                this.stack[this.sp] = this.pc;
                this.sp++;
                this.pc = opcode & 0x0FFF;
                
                // we do not want to increase pc this tick
                this.pc -= 2;
                break;
            case 0x3000:
                if (this.register[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) 
                {
                    this.pc += 2;
                }
                break;
            case 0x4000:
                if (this.register[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF)) 
                {
                    this.pc += 2;
                }
                break;
            case 0x5000:
                const Vx = this.register[(opcode & 0x0F00 >> 8)];
                const Vy = this.register[(opcode & 0x00F0) >> 4];

                if (Vx === Vy) {
                    this.pc += 2;
                }
                break;
            case 0x6000:
                this.register[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
                break;
            case 0x7000: {
                const x = (opcode & 0x0F00) >> 8;

                this.register[x] = (opcode & 0x00FF) + this.register[x];
                break;
            }
            case 0x8000: {
                const x = (opcode & 0x0F00) >> 8;
                const y = (opcode & 0x00F0) >> 4;

                switch (opcode & 0x000F) {
                    case 0x0000:
                        this.register[x] = this.register[y];
                        break;
                    case 0x0001:
                        this.register[x] = this.register[x] | this.register[y];
                        break;
                    case 0x0002:
                        this.register[x] = this.register[x] & this.register[y];
                        break;
                    case 0x0003:
                        this.register[x] = this.register[x] ^ this.register[y];
                        break;
                    case 0x0004: {
                        const res = this.register[x] + this.register[y];
                        this.register[0xF] = res > 255 ? 1 : 0;
                        this.register[x] = res & 0x00FF;
                    
                        break;
                    }
                    case 0x0005:
                        this.register[0xF] = this.register[x] > this.register[y] ? 1 : 0;
                        // TODO: check if we need custom underflow here
                        this.register[x] = this.register[x] - this.register[y];
                        break;
                    case 0x0006:
                        this.register[0xF] = this.register[x] & 0x1;
                        this.register[x] = (this.register[x] / 2)|0;
                        break;
                    case 0x0007:
                        this.register[0xF] = this.register[y] > this.register[x] ? 1 : 0;
                        // TODO: check if we need custom underflow here
                        this.register[x] = this.register[y] - this.register[x];
                        break;
                    case 0x000E:
                        this.register[0xF] = this.register[x] & 0x1;
                        this.register[x] = (this.register[x]*2)|0;
                        break;
                }
                break;
            }
            case 0x9000: {
                const x = (opcode & 0x0F00) >> 8;
                const y = (opcode & 0x00F0) >> 4;

                if (this.register[x] !== this.register[y]) {
                    this.pc += 2;
                }
                break;
            }
            case 0xA000:
                this.I = opcode & 0x0FFF;
                break;
            case 0xB000:
                this.pc = (opcode & 0x0FFF) + this.register[0x0];
                break;
            case 0xC000: {
                const x = (opcode & 0x0F00) >> 8;
                const random = (Math.random()*255)|0;

                this.register[x] = random & (opcode & 0x00FF);
                break;
            }
            case 0xD000: {
                const x = (opcode & 0x0F00) >> 8;
                const y = (opcode & 0x00F0) >> 4;
                const height = opcode & 0x000F;

                this.register[0xF] = 0;

                let collision = false;

                for (let line = 0; line < height; line++) {
                    collision =  collision || this.drawByte(x, y+line, this.memory[this.I + line]);
                }
                
                this.drawFlag = true;
                if (collision) {
                    this.register[0xF] = 1;
                }
                break;
            }
            case 0xE000: {
                const x = (opcode & 0x0F00) >> 8;

                switch(opcode & 0x00FF) {
                    case 0x009E:
                        // TODO: Handle Input
                        break;
                    case 0x00A1:
                        // TODO: Handle Input
                        break;
                }
                break;
            }
            case 0xF000: {
                const x = (opcode & 0x0F00) >> 8;

                switch (opcode & 0x00FF) {
                    case 0x0007:
                        this.register[x] = this.delay;        
                        break;
                    case 0x000A:
                        // TODO: implement interrupt
                        throw new Error("Hardware Interrupt not supported yet");
                        break;
                    case 0x0015:
                        this.delay = this.register[x];
                        break;
                    case 0x0018:
                        this.sound = this.register[x];
                        break;
                    case 0x001E:
                        this.I = this.I + this.register[x]; 
                        break;
                    case 0x0029:
                        // TODO: implement reverse lookup of sprite
                        throw new Error("Rendering not supported yet");
                        break;
                    case 0x0033:
                        //TODO: implement BCD
                        break;
                    case 0x0055:
                        for (let i = 0x0; i <= 0xF; i++) {
                            this.memory[this.I + i] = this.register[i];
                        }
                        break;
                    case 0x0065:
                        for (let i = 0x0; i <= 0xF; i++) {
                            this.register[i] = this.memory[this.I+i];
                        }
                        break;
                }
                break;
            }
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

        return current === 0x1 && current !== this.gfx[pixel]
    }
    //#endregion
    
    //#region Helpe Methods
    public getGraphicsMemory(): Uint8Array
    {
        return this.gfx;
    }
    //#endregion
}
