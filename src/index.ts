/**
 * This file is just a silly example to show everything working in the browser.
 * When you're ready to start on your site, clear the file. Happy hacking!
 **/

import Chip8 from './chip8';
import Display from './display';

(async () => {
  const canvas = document.getElementById('screen') as HTMLCanvasElement;

const response = await fetch ('./test_opcode.ch8');
const blob = await response.blob();
const rom = new Uint8Array(await blob.arrayBuffer());

const instance = new Chip8();
const display = new Display(instance, canvas!);

instance.init();
instance.loadGame(rom);

display.draw();

const run  = () => {
  instance.tick();
  if (instance.drawFlag) {
    display.draw();
  }

  // requestAnimationFrame(run);
}

run();

})();
