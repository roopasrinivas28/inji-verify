jest.mock("zxing-wasm/full", () => ({
    readBarcodes: jest.fn(),
}));

jest.mock("pdfjs-dist", () => ({
    GlobalWorkerOptions: {},
}));

jest.mock("pdfjs-dist/build/pdf.worker.mjs", () => "pdf-worker");

import {readBarcodes} from "zxing-wasm/full";

Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:test"),
});

const {readQRcodeFromImageFile} = require("../../src/utils/uploadQRCodeUtils");

describe("readQRcodeFromImageFile", () => {
    const imageFile = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    } as unknown as File;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("reports a dedicated error when an image contains multiple valid QR codes", async () => {
        (readBarcodes as jest.Mock).mockResolvedValue([
            {isValid: true, text: "first-qr", format: "QRCode"},
            {isValid: true, text: "second-qr", format: "QRCode"},
        ]);

        await expect(readQRcodeFromImageFile(imageFile, "QRCode")).rejects.toMatchObject({
            name: "MULTIPLE_QR_FOUND",
            message: "Multiple QR codes detected, please retry with an image containing a single QR code.",
        });
    });

    test("continues to return one valid QR code", async () => {
        (readBarcodes as jest.Mock).mockResolvedValue([
            {isValid: true, text: "single-qr", format: "QRCode"},
        ]);

        await expect(readQRcodeFromImageFile(imageFile, "QRCode")).resolves.toBe("single-qr");
    });
});
