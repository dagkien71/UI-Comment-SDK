export declare class ImageModal {
    private element;
    private imageUrl;
    private isVisible;
    private keydownHandler;
    private imageElement;
    private currentScale;
    private minScale;
    private maxScale;
    constructor(imageUrl: string);
    private createElement;
    private setupEventListeners;
    private downloadImage;
    private zoomIn;
    private zoomOut;
    private resetZoom;
    private toggleZoom;
    private updateImageTransform;
    private updateCursor;
    show(): void;
    hide(): void;
    destroy(): void;
}
//# sourceMappingURL=ImageModal.d.ts.map