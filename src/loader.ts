export class Loader {
    images: Record<string, HTMLImageElement>;

    constructor() {
        this.images = {};
    }

    isLoaded(imageUrl: string) {
        return this.images[imageUrl] !== undefined;
    }

    load(imageUrl: string) {
        return new Promise<void>((resolve) => {
            if (!this.images[imageUrl]) {
                this.images[imageUrl] = new Image();
                this.images[imageUrl].crossOrigin = ''; // ask for (anonymous) permission to access the response
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
