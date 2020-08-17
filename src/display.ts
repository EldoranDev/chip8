import type Chip8 from "./chip8";

export default class Display {
    private static WIDTH = 64;
    private static HEIGHT = 32;

    private gfxMemory: Uint8Array;
    private ctx: CanvasRenderingContext2D;

    private pixelWidth = 1;
    private pixelHeight = 1;

    private colorForeground: string;
    private colorBackground: string;

    constructor(
        chip: Chip8,
        target: HTMLCanvasElement
    ) {
        this.ctx = target.getContext('2d')!;
        this.gfxMemory = chip.getGraphicsMemory();

        this.pixelWidth = target.width / Display.WIDTH;
        this.pixelHeight = target.height/Display.HEIGHT;

        this.colorBackground = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
        this.colorForeground = getComputedStyle(document.documentElement).getPropertyValue('--color-foreground');
    }

    public draw(): void {
        for (let x = 0; x < Display.WIDTH; x++) {
            for (let y = 0; y < Display.HEIGHT; y++) {
                
                if (!this.gfxMemory[y * Display.WIDTH + x]) {
                    this.ctx.fillStyle = this.colorBackground;
                } else {
                    this.ctx.fillStyle = this.colorForeground;
                }

                this.ctx.fillRect(
                    x * this.pixelWidth, 
                    y * this.pixelHeight,
                    this.pixelWidth,
                    this.pixelHeight
                );
            }
        }
    }
}
