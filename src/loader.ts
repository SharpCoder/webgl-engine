export class Loader {
    images: Record<string, HTMLImageElement>;

    constructor() {
        this.images = {};
    }

    load(imageUrl: string) {
        return new Promise<void>((resolve) => {
            if (!this.images[imageUrl]) {
                this.images[imageUrl] = new Image();
                this.images[imageUrl].src = imageUrl;
                this.images[imageUrl].addEventListener('load', () => resolve());
            } else {
                resolve();
            }
        });
    }

    fetch(imageUrl: string) {
        return this.images[imageUrl];
    }
}
