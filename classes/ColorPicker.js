/**
 * RGB888 Class
 */

export class Rgb888 {
    constructor(redOrColor, green = undefined, blue = undefined) {
        if (green === undefined && blue === undefined) {
            this.value = redOrColor;
        } else {
            this.value = (redOrColor << 16) | (green << 8) | blue;
        }

        this.red = (this.value >> 16) & 0xFF;
        this.green = (this.value >> 8) & 0xFF;
        this.blue = this.value & 0xFF;
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
    constructor(redOrColor, green = undefined, blue = undefined) {
        if (green === undefined && blue === undefined) {
            this.value = redOrColor & 0xFFFF;
        } else {
            const r = (redOrColor >> 3) & 0x1F;
            const g = (green >> 2) & 0x3F;
            const b = (blue >> 3) & 0x1F;
            this.value = (r << 11) | (g << 5) | b;
        }
    }

    static fromRgb888(rgb888) {
        let r5 = (rgb888.red >> 3) & 0x1F;
        let g6 = (rgb888.green >> 2) & 0x3F;
        let b5 = (rgb888.blue >> 3) & 0x1F;
        return new Rgb565((r5 << 11) | (g6 << 5) | b5);
    }

    rgb888() {
        let r = ((this.value >> 11) & 0x1F) * 8;
        let g = ((this.value >> 5) & 0x3F) * 4;
        let b = (this.value & 0x1F) * 8;
        return new Rgb888(r, g, b);
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
    fnCallback = () => { };

    get color() {
        return this.#color;
    }

    set color(arg) {
        this.#color = arg;
        console.log("setting color: ", this.#color);
        this.element.querySelector("button").innerText = this.#color.toString();
        this.dropDown.querySelector(".color-input").value = this.#color.toString();
    }

    get hue() {
        return this.#hue;
    }

    set hue(arg) {
        this.dropDown.querySelector(".hue .track").style.width = `${(arg / 360) * 100}%`;
        this.#hue = arg;

        const saturationCanvas = this.dropDown.querySelector(".saturation canvas");
        this.#drawSaturationStrip(saturationCanvas.getContext("2d"));
        this.color = new Rgb565(Rgb888.fromHSV(this.#hue, this.#saturation, this.#value).value);
    }

    get saturation() {
        return this.#saturation;
    }

    set saturation(arg) {
        this.#saturation = arg;
        this.color = new Rgb565(Rgb888.fromHSV(this.#hue, this.#saturation, this.#value).value);
    }

    get value() {
        return this.#value;
    }

    set value(arg) {
        this.#value = arg;
        this.color = new Rgb565(Rgb888.fromHSV(this.#hue, this.#saturation, this.#value).value);
    }

    #drawSaturationStrip(ctx) {
        const width = ctx.canvas.clientWidth;
        const height = ctx.canvas.clientHeight;
        let buffer = new Uint16Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let color = Rgb888.fromHSV(this.hue, y / height, x / width);
                buffer[y * width + x] = Rgb565.fromRgb888(color).value;
            }
        }


        let imageData = ctx.createImageData(width, height);
        let data = imageData.data;

        for (let i = 0; i < buffer.length; i++) {
            let color = new Rgb565(buffer[i]).rgb888();
            let index = i * 4;
            data[index] = color.red;
            data[index + 1] = color.green;
            data[index + 2] = color.blue;
            data[index + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    #drawHueStrip(ctx) {
        const width = ctx.canvas.clientWidth;
        const height = ctx.canvas.clientHeight;
        let buffer = new Uint16Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let hue = (x / width) * 360;
                let color = Rgb888.fromHSV(hue, 1, 1);
                buffer[y * width + x] = Rgb565.fromRgb888(color).value;
            }
        }


        let imageData = ctx.createImageData(width, height);
        let data = imageData.data;

        for (let i = 0; i < buffer.length; i++) {
            let color = new Rgb565(buffer[i]).rgb888();
            let index = i * 4;
            data[index] = color.red;
            data[index + 1] = color.green;
            data[index + 2] = color.blue;
            data[index + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    constructor(elementWhereInsert, label) {
        this.element = document.createElement('div');
        this.element.innerHTML += `
        <div class="color-picker">
            <label>${label}</label>
            <button>${this.color.toString()}</button>
        </div>
        `;

        elementWhereInsert.appendChild(this.element);
        this.element.insertAdjacentHTML(
            'beforeend',
            `<div class="color-picker-dropdown">
                <p>True RGB565 Color picker™</p>
                <div class="saturation">
                    <div class="saturation-track"></div>
                    <canvas width="200" height="200">
                </div>
                <div class="hue">
                    <div class="track"></div>
                    <input type="range" min="0" max="360">
                    <canvas width="200" height="10"></canvas>
                </div>
                <input type="text" class="color-input" value="${this.color.toString()}" maxlength="7">
            </div>`
        );

        this.dropDown = this.element.querySelector(".color-picker-dropdown");

        const hueCanvas = this.dropDown.querySelector(".hue canvas");
        this.#drawHueStrip(hueCanvas.getContext("2d"));

        const openColorPickerButton = this.element.querySelector("button");
        openColorPickerButton.addEventListener("click", () => {
            this.toggleDisplay();
        });

        const hueStripRange = this.dropDown.querySelector(".hue input");

        hueStripRange.addEventListener("input", (event) => {
            this.hue = event.target.value;
            (this.fnCallback)(this.color);
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
            const track = this.dropDown.querySelector(".saturation-track");
            track.style.top = `${y}px`;
            track.style.left = `${x}px`;

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