import type Chip8 from "./chip8";

export default class Info {
    private instructions: Element;

    private instructionOffset: number = 0;

    constructor(private cpu: Chip8, html: HTMLElement) {
        this.instructions = html.querySelector('#instructions')!;
    }

    update()
    {
        this.updateInstructions();
    }

    private updateInstructions():void {
        const table = document.createElement('table');

        if (this.instructionOffset > this.cpu.pc + 15 || this.instructionOffset < this.cpu.pc - 15) {
            this.instructionOffset = this.cpu.pc;
        }

        for (let i = this.instructionOffset; i < this.instructionOffset + 15; i++) {
            const row = document.createElement('tr');
            
            if (i === this.cpu.pc) {
                row.classList.add('current');
            }

            const index = document.createElement('td');
            index.innerText = `${(i).toString(16).padStart(4, '0')}`;
            
            const value = document.createElement('td');
            value.innerText = `${(this.cpu.memory[i]).toString(16).padStart(2, '0')}`;

            row.appendChild(index);
            row.appendChild(value);

            table.appendChild(row);
        }

        if (!this.instructions.children.length) {
            this.instructions.appendChild(table);
        } else {
            this.instructions.replaceChild(table, this.instructions.firstChild!);
        }
    }
}