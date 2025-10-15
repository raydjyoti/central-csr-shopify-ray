import React, { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve);
  });
}

async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = (rotate * Math.PI) / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();
}

interface AvatarResizeProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

const AvatarResize: React.FC<AvatarResizeProps> = ({ imageSrc, onClose, onSave }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  const handleSaveCrop = async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop, scale, rotate);

    const blob = await toBlob(previewCanvasRef.current);
    if (blob) {
      onSave(blob);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50 flex justify-center items-center m-0"
      style={{ height: "100dvh" as any }}
    >
      <div
        className="relative mx-auto p-6 border w-11/12 sm:w-full sm:max-w-lg shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden flex flex-col"
        style={{ maxHeight: "90dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <h3
          className="text-lg font-semibold text-gray-900 mb-4"
          style={{
            fontFamily: "Inter",
            fontWeight: "600",
          }}
        >
          Edit Avatar
        </h3>
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" as any }}>
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              keepSelection
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="scale" className="block text-sm font-medium text-gray-700">
                Scale
              </label>
              <input
                id="scale"
                type="range"
                value={scale}
                min="1"
                max="2"
                step="0.01"
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="rotate" className="block text-sm font-medium text-gray-700">
                Rotate
              </label>
              <input
                id="rotate"
                type="range"
                value={rotate}
                min="-180"
                max="180"
                onChange={(e) => setRotate(Number(e.target.value))}
                className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
        <canvas
          ref={previewCanvasRef}
          style={{
            display: "none",
            objectFit: "contain",
            width: completedCrop?.width,
            height: completedCrop?.height,
          }}
        />
        <div className="mt-6 flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0 sticky bottom-0 bg-white pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCrop}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarResize;
