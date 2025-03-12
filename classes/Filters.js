export class Filters {
    #filters = new Map();
    #element;

    constructor(element) {
        this.#element = element;
    }

    setFilter(name, value) {
        this.#filters.set(name, value);
    }

    getFilterValue(name) {
        const value = this.#filters.get(name) ?? "0%";
        return Number(value.replace("%", ""));
    }

    apply() {
        let cssString = ""; 
        for (const [key, value] of this.#filters.entries()) {
            cssString += `${key}(${value}%) `;
        }
        cssString = cssString.trimEnd();

        console.log(cssString);

        this.#element.style.filter = cssString;
    }
}