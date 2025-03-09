import init from './pkg/edgy_color_generator.js';
import { ColorPicker, Rgb565 } from './classes/ColorPicker.js';


async function run() {
    document.addEventListener("DOMContentLoaded", async () => {
        await init();

        const container = document.querySelector(".controls");
        for (const element of ["background1", "background2", "background3", "foreground1", "foreground2", "foreground3"]) {
            const picker = new ColorPicker(container, element);
        }

        
        console.log(Rgb565.fromHSV(120, 1, 1).rgb888());
    });
}

run();