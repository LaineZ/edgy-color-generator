import init from './pkg/edgy_color_generator.js';
import { ColorPicker, Rgb565 } from './classes/ColorPicker.js';


async function run() {
    document.addEventListener("DOMContentLoaded", async () => {
        await init();

        const container = document.querySelector(".controls");
        for (const element of ["background", "background2", "background3", "foreground1", "foreground2", "foreground3"]) {
            new ColorPicker(container, element).change((color) => {
                const event = new CustomEvent("colorChange", { detail: { "key": element, value: color.value }});
                document.body.dispatchEvent(event);
            });
        }

        
        console.log(Rgb565.fromHSV(120, 1, 1).rgb888());
    });
}

run();