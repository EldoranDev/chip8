/**
 * This file is just a silly example to show everything working in the browser.
 * When you're ready to start on your site, clear the file. Happy hacking!
 **/

import Chip8 from './chip8';
import Display from './display';
import Info from './info';

import './style/base.css';

(async () => {
  const canvas = document.getElementById('screen') as HTMLCanvasElement;

const response = await fetch ('./roms/demos/stars.ch8');
const blob = await response.blob();
const rom = new Uint8Array(await blob.arrayBuffer());

const instance = new Chip8();
const display = new Display(instance, canvas!);
const info = new Info(instance, document.getElementById("info")!);

const slowFactor = 1;
let slow = 0;

instance.init();
instance.loadGame(rom);

display.draw();

let stepping = false;
let exit = false;

window.onkeydown = (e: KeyboardEvent) => {
  if (e.key === 'c') {
    exit = true;
  }

  if (e.key === 's') {
    stepping = !stepping;
  }

  if (e.keyCode === 32) {
    slow++;
  }
}

const run  = () => {
  if (exit) return;

  if (stepping && slow < slowFactor) {
    requestAnimationFrame(run);
    return;
  }

  slow = 0;
  info.update();

  instance.tick();

  if (instance.drawFlag) {
    display.draw();
  }


  requestAnimationFrame(run);
}

run();

})();
