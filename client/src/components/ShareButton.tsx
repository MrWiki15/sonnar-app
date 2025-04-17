import { useState, useRef } from "react";
import {
  Share2,
  X,
  Twitter,
  Facebook,
  Linkedin,
  QrCode,
  Download,
  Settings,
  PaintBucket,
  Image as ImageIcon,
  CheckSquare,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

const ShareButton = ({ eventUrl, eventName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrConfig, setQrConfig] = useState({
    size: 256,
    fgColor: "#000000",
    bgColor: "#ffffff",
    includeMargin: true,
    qrLevel: "H", // L, M, Q, H
    logo: null as string | null,
  });

  const qrRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current);
      const link = document.createElement("a");
      link.download = `qr-${eventName.replace(/ /g, "_")}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Error al descargar QR:", error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrConfig((prev) => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const socialNetworks = [
    {
      name: "Twitter",
      icon: <Twitter size={20} />,
      url: `https://twitter.com/intent/tweet?text=Únete%20a%20${encodeURIComponent(
        eventName
      )}%20en%20Sonnar%20${eventUrl}`,
    },
    {
      name: "Facebook",
      icon: <Facebook size={20} />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        eventUrl
      )}`,
    },
    {
      name: "LinkedIn",
      icon: <Linkedin size={20} />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        eventUrl
      )}`,
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-fiesta-dark hover:bg-white transition-colors"
      >
        <Share2 size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl relative flex flex-col h-[90vh]">
            {/* Encabezado */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Compartir y personalizar QR
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-fiesta-dark"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-auto">
              {/* Panel de configuración */}
              <div className="md:col-span-1 space-y-6 pr-4 border-r">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Settings size={18} />
                    Configuración del QR
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Tamaño</label>
                      <input
                        type="range"
                        min="128"
                        max="512"
                        value={qrConfig.size}
                        onChange={(e) =>
                          setQrConfig((prev) => ({
                            ...prev,
                            size: Number(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">
                        {qrConfig.size}px
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Color principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={qrConfig.fgColor}
                          onChange={(e) =>
                            setQrConfig((prev) => ({
                              ...prev,
                              fgColor: e.target.value,
                            }))
                          }
                        />
                        <span className="text-xs">{qrConfig.fgColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Color de fondo
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={qrConfig.bgColor}
                          onChange={(e) =>
                            setQrConfig((prev) => ({
                              ...prev,
                              bgColor: e.target.value,
                            }))
                          }
                        />
                        <span className="text-xs">{qrConfig.bgColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Nivel de corrección
                      </label>
                      <select
                        value={qrConfig.qrLevel}
                        onChange={(e) =>
                          setQrConfig((prev) => ({
                            ...prev,
                            qrLevel: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="L">Bajo (7%)</option>
                        <option value="M">Medio (15%)</option>
                        <option value="Q">Alto (25%)</option>
                        <option value="H">Máximo (30%)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={qrConfig.includeMargin}
                        onChange={(e) =>
                          setQrConfig((prev) => ({
                            ...prev,
                            includeMargin: e.target.checked,
                          }))
                        }
                      />
                      <label className="text-sm">Incluir margen</label>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ImageIcon size={16} />
                        Logo personalizado
                      </h5>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-2 border rounded text-sm hover:bg-gray-50"
                      >
                        {qrConfig.logo ? "Cambiar logo" : "Añadir logo"}
                      </button>
                      {qrConfig.logo && (
                        <button
                          onClick={() =>
                            setQrConfig((prev) => ({ ...prev, logo: null }))
                          }
                          className="mt-2 text-red-500 text-sm w-full"
                        >
                          Eliminar logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa del QR */}
              <div className="md:col-span-2 flex flex-col items-center justify-center">
                <div ref={qrRef} className="relative">
                  <QRCodeSVG
                    value={eventUrl}
                    size={qrConfig.size}
                    level={qrConfig.qrLevel}
                    includeMargin={qrConfig.includeMargin}
                    fgColor={qrConfig.fgColor}
                    bgColor={qrConfig.bgColor}
                  />
                  {qrConfig.logo && (
                    <img
                      src={qrConfig.logo}
                      alt="Logo"
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: qrConfig.size * 0.2,
                        height: qrConfig.size * 0.2,
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2 px-4 py-2 bg-fiesta-primary text-white rounded-lg hover:bg-fiesta-primary/90"
                  >
                    <Download size={16} />
                    Descargar QR
                  </button>
                </div>
              </div>
            </div>

            {/* Sección de compartir */}
            <div className="border-t p-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={eventUrl}
                    readOnly
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(eventUrl)}
                    className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Copiar enlace
                  </button>

                  <div className="flex gap-2">
                    {socialNetworks.map((network) => (
                      <a
                        key={network.name}
                        href={network.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                        title={`Compartir en ${network.name}`}
                      >
                        {network.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
