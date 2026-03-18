import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
  imageFile: File | null;
}

export function ImageCropper({ open, onClose, onCrop, imageFile }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCanvas();
    };
    img.src = imgSrc;
  }, [imgSrc]);

  useEffect(() => {
    drawCanvas();
  }, [scale, offset]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, size, size);

    const imgAspect = img.width / img.height;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = size * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = size * scale;
      drawH = drawW / imgAspect;
    }

    const dx = (size - drawW) / 2 + offset.x;
    const dy = (size - drawH) / 2 + offset.y;

    ctx.drawImage(img, dx, dy, drawW, drawH);

    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }, [scale, offset]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCrop(dataUrl);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl max-w-[340px] p-4">
        <DialogHeader>
          <DialogTitle className="text-center">Enquadrar Foto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative rounded-full overflow-hidden border-4 border-primary/30 cursor-grab active:cursor-grabbing touch-none"
            style={{ width: 280, height: 280 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
          <p className="text-xs text-muted-foreground text-center">Arraste para posicionar, use os botões para zoom</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} data-testid="button-zoom-out">
              <ZoomOut size={18} />
            </Button>
            <span className="text-sm font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => setScale(s => Math.min(3, s + 0.1))} data-testid="button-zoom-in">
              <ZoomIn size={18} />
            </Button>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={onClose} data-testid="button-cancel-crop">
              <X className="mr-2" size={16} /> Cancelar
            </Button>
            <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleCrop} data-testid="button-confirm-crop">
              <Check className="mr-2" size={16} /> Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
