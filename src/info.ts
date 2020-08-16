import type Chip8 from "./chip8";

export default class Info {
    private pc: Element;

    constructor(private cpu: Chip8, html: HTMLElement) {
        this.pc = html.querySelector('#pc.value')!;
    }

    update()
    {
        this.pc.innerHTML = this.cpu.pc.toString();
    }
}