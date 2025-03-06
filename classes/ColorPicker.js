export class ColorPicker {
    element = null;
    dropDown = null;
    #color = 0xffff;

    get color() {
        return this.#color;
    }

    set color(arg) {
        this.element.querySelector("button").innerText = arg;
    }

    constructor(elementWhereInsert, label) {
        this.element = document.createElement('div');
        this.element.innerHTML += `
        <div class="color-picker">
            <label>${label}</label>
            <button>0x${this.color.toString(16)}</button>
        </div>
        `;

        elementWhereInsert.appendChild(this.element);
        this.element.insertAdjacentHTML(
            'beforeend',
            `<div class="color-picker-dropdown">
                <p>Test!</p>
            </div>`
        );

        this.dropDown = this.element.querySelector(".color-picker-dropdown");
        const selector = this.element.querySelector("button");

        selector.addEventListener("click", () => {
            this.toggleDisplay();
        });

        window.addEventListener("closeOthers", (element) => {
            if (element.detail != this) {
                this.hide();
            }
        });


        this.hide();
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