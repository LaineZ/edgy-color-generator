/**
 * RGB888 Class
 */
import { rgb565_to_rgb888 } from '../pkg/edgy_color_generator.js';

export class Rgb888 {
    constructor(redOrColor, green = undefined, blue = undefined) {
        if (green === undefined && blue === undefined) {
            this.value = redOrColor;
            this.red = (this.value >> 16) & 0xFF;
            this.green = (this.value >> 8) & 0xFF;
            this.blue = this.value & 0xFF;
        } else {
            this.red = redOrColor;
            this.green = green;
            this.blue = blue;
            this.value = (redOrColor << 16) | (green << 8) | blue;
        }
    }

    static fromHSV(h, s, v) {
        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;
        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return new Rgb888(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
    }

    toString() {
        return `#${this.value.toString(16).toUpperCase().padEnd(6, '0')}`;
    }
}

/**
 * RGB565 Class
 */

export class Rgb565 {
    /**
     * 
     * @param {*} redOrColor u16 color or red component (5 bit)
     * @param {*} green green component (6 bit)
     * @param {*} blue  blue component (5 bit)
     */

    red = 0;
    green = 0;
    blue = 0;

    constructor(redOrColor, green = undefined, blue = undefined) {
        if (green === undefined && blue === undefined) {
            this.value = redOrColor & 0xFFFF;
        } else {
            this.red = redOrColor;
            this.green = green;
            this.blue = blue;
            this.value = (this.red << 11) | (this.green << 5) | this.blue;
        }
    }

    static fromRgb888(rgb888) {
        let r5 = (rgb888.red >> 3) & 0x1F;
        let g6 = (rgb888.green >> 2) & 0x3F;
        let b5 = (rgb888.blue >> 3) & 0x1F;
        return new Rgb565((r5 << 11) | (g6 << 5) | b5);
    }

    rgb888() {    
        const color = rgb565_to_rgb888(this.value);
        return new Rgb888(color);
    }

    static fromHSV(h, s, v) {
        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;
        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return new Rgb565(Math.round((r + m) * 31), Math.round((g + m) * 63), Math.round((b + m) * 31));
    }

    hsv() {
        let r = this.red / 31;
        let g = this.green / 63;
        let b = this.blue / 31;

        console.log(r, g, b);

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, v = max;
        let d = max - min;

        s = max === 0 ? 0 : d / max;

        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
            }
            h *= 60;
        }

        return { 
            h: h,
            s: s,
            v: v 
        };
    }

    toString() {
        return `#${this.value.toString(16).toUpperCase().padEnd(4, '0')}`;
    }
}

export class ColorPicker {
    element = null;
    dropDown = null;
    #color = new Rgb565(0, 0, 0);

    #hue = 0;
    #saturation = 0;
    #value = 0;
    #saturationBoxMouseHold = false;
    #hueBoxMouseHold = false;
    fnCallback = () => { };

    get color() {
        return this.#color;
    }

    set color(arg) {
        this.#color = arg;
        const button = this.element.querySelector("button");
        button.innerText = this.#color.toString();
        button.style.backgroundColor = this.#color.rgb888().toString();
        this.dropDown.querySelector(".color-input").value = this.#color.toString();
        this.dropDown.querySelector(".color-input-rgb888").value = this.#color.rgb888().toString();
        this.dropDown.querySelector(".hsv").innerText = `${this.hue}° ${this.saturation * 100}% ${this.value * 100}%`;
    }

    get hue() {
        return this.#hue;
    }

    set hue(arg) {
        this.dropDown.querySelector(".hue .track").style.width = `${(arg / 360) * 100}%`;
        this.#hue = arg;

        const saturationCanvas = this.dropDown.querySelector(".saturation canvas");
        this.#drawSaturationStrip(saturationCanvas.getContext("2d"));

        this.color = Rgb565.fromHSV(this.#hue, this.#saturation, this.#value);
    }

    get saturation() {
        return this.#saturation;
    }

    set saturation(arg) {
        this.#saturation = arg;
        const saturationCanvas = this.dropDown.querySelector(".saturation canvas");
        const rect = saturationCanvas.getBoundingClientRect();

        const x = this.#saturation * rect.width;
        const track = this.dropDown.querySelector(".saturation-track");
        track.style.left = `${x}px`;

        this.color = Rgb565.fromHSV(this.#hue, this.#saturation, this.#value);
    }

    get value() {
        return this.#value;
    }

    set value(arg) {
        this.#value = arg;
        const saturationCanvas = this.dropDown.querySelector(".saturation canvas");

        const rect = saturationCanvas.getBoundingClientRect();
        const y = this.#value * rect.height;
        const track = this.dropDown.querySelector(".saturation-track");
        track.style.top = `${y}px`;

        this.color = Rgb565.fromHSV(this.#hue, this.#saturation, this.#value);
    }

    #drawSaturationStrip(ctx) {
        const width = ctx.canvas.clientWidth;
        const height = ctx.canvas.clientHeight;
        let imageData = ctx.createImageData(width, height);
        let data = imageData.data;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let color = Rgb565.fromHSV(this.hue, x / width, y / height).rgb888();
                let index = (y * width + x) * 4;
    
                data[index] = color.red;
                data[index + 1] = color.green;
                data[index + 2] = color.blue;
                data[index + 3] = 255;
            }
        }
    
        ctx.putImageData(imageData, 0, 0);
    }

    #drawHueStrip(ctx) {
        const width = ctx.canvas.clientWidth;
        const height = ctx.canvas.clientHeight;

        let imageData = ctx.createImageData(width, height);
        let data = imageData.data;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let hue = (x / width) * 360;
                let color = Rgb565.fromHSV(hue, 1, 1).rgb888();
                let index = (y * width + x) * 4;
    
                data[index] = color.red;
                data[index + 1] = color.green;
                data[index + 2] = color.blue;
                data[index + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    constructor(elementWhereInsert, label) {
        this.element = document.createElement('div');
        this.element.innerHTML += `
        <table class="color-picker">
            <tr>
                <td>${label}</td>
                <td><button style="background-color: ${this.color.toString()}">${this.color.toString()}</button></td>
            </tr>
        </table>
        `;

        elementWhereInsert.appendChild(this.element);
        this.element.insertAdjacentHTML(
            'beforeend',
            `<div class="color-picker-dropdown">
                <small>True RGB565 Color picker™</small>
                <div class="saturation">
                    <div class="saturation-track"></div>
                    <canvas width="200" height="200">
                </div>
                <div class="hue">
                    <div class="track"></div>
                    <canvas width="200" height="20"></canvas>
                </div>
                <input type="text" class="color-input" value="${this.color.toString()}" maxlength="5">
                <input type="text" class="color-input-rgb888" value="${this.color.rgb888().toString()}" maxlength="5">
                <small class="hsv">${this.hue}° ${this.saturation * 100}% ${this.value * 100}%</small>
            </div>`
        );

        this.dropDown = this.element.querySelector(".color-picker-dropdown");

        const hueCanvas = this.dropDown.querySelector(".hue canvas");
        this.#drawHueStrip(hueCanvas.getContext("2d"));

        const openColorPickerButton = this.element.querySelector("button");
        openColorPickerButton.addEventListener("click", () => {
            this.toggleDisplay();
        });

        const hueStrip = this.dropDown.querySelector(".hue");
        hueStrip.addEventListener("mousemove", (event) => {
            if (!this.#hueBoxMouseHold) {
                return;
            }

            const rect = event.target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            this.hue = Math.floor((x / rect.width) * 360.0);
            (this.fnCallback)(this.color);
        });

        hueStrip.addEventListener("mouseup", () => {
            this.#hueBoxMouseHold = false;
        });

        hueStrip.addEventListener("mousedown", () => {
            this.#hueBoxMouseHold = true;
        });

        const saturationCanvas = this.dropDown.querySelector(".saturation canvas");

        const ctx = saturationCanvas.getContext("2d");
        this.#drawSaturationStrip(ctx);

        saturationCanvas.addEventListener("mousemove", (event) => {
            if (!this.#saturationBoxMouseHold) {
                return;
            }
            const rect = event.target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.saturation = x / rect.width;
            this.value = y / rect.height;
            (this.fnCallback)(this.color);
        });

        saturationCanvas.addEventListener("mouseup", () => {
            this.#saturationBoxMouseHold = false;
        });

        saturationCanvas.addEventListener("mousedown", () => {
            this.#saturationBoxMouseHold = true;
        });

        this.dropDown.querySelector(".color-input").addEventListener("change", (event) => {
            const value = event.target.value;
            const hsv = this.color.hsv();

            this.hue = hsv.h;
            this.saturation = hsv.s;
            this.value = hsv.v;

            this.color = new Rgb565(Number(value.replace("#", "0x")));
            (this.fnCallback)(this.color);
        });

        window.addEventListener("closeOthers", (event) => {
            if (event.detail != this) {
                this.hide();
            }
        });


        this.hide();
    }

    change(fnCallback) {
        this.fnCallback = fnCallback;
    }

    hide() {
        this.dropDown.style.display = "none";
    }

    toggleDisplay() {
        if (this.dropDown.style.display == "none") {
            this.dropDown.style.display = "block";
            const event = new CustomEvent("closeOthers", { detail: this });
            window.dispatchEvent(event);
        } else {
            this.dropDown.style.display = "none";
        }
    }
}