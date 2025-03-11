import init from './pkg/edgy_color_generator.js';
import { get_theme_colors } from './pkg/edgy_color_generator.js';
import { ColorPicker, Rgb565 } from './classes/ColorPicker.js';


async function run() {
    document.addEventListener("DOMContentLoaded", async () => {
        await init();

        const container = document.querySelector(".controls");
        const theme = get_theme_colors();

        for (const [key, value] of Object.entries(theme)) {
            new ColorPicker(container, key, new Rgb565(value)).change((color) => {
                const event = new CustomEvent("colorChange", { detail: { "key": key, value: color.value }});
                document.body.dispatchEvent(event);
            });
        }
    });
}

run();