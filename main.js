import init from './pkg/edgy_color_generator.js';
import { get_theme_colors } from './pkg/edgy_color_generator.js';
import { ColorPicker, Rgb565 } from './classes/ColorPicker.js';
import { Filters } from './classes/Filters.js';


function registerFilterProp(filters, prop) {
    document.querySelector(`#display-${prop}`).addEventListener("input", (event) => {
        const value = event.target.value;
        filters.setFilter(prop, value);

        document.querySelector(`#${prop}-value`).innerText = `${prop} ${value}%`;
        
        filters.apply();
    });
}

async function run() {
    document.addEventListener("DOMContentLoaded", async () => {
        await init();

        const container = document.querySelector(".controls");
        const theme = get_theme_colors();
        const filters = new Filters(document.querySelector(".simulator-window canvas"));

        for (const [key, value] of Object.entries(theme)) {
            new ColorPicker(container, key, new Rgb565(value)).change((color) => {
                const event = new CustomEvent("colorChange", { detail: { "key": key, value: color.value }});
                document.body.dispatchEvent(event);
            });
        }

        document.querySelector("#invert-toggle").addEventListener("click", (event) => {
            if (filters.getFilterValue("invert") > 0) {
                filters.setFilter("invert", "0");
            } else {
                filters.setFilter("invert", "100");
            }
            filters.apply();
        });

        registerFilterProp(filters, "brightness");
        registerFilterProp(filters, "saturate");
        registerFilterProp(filters, "contrast");
    });
}

run();