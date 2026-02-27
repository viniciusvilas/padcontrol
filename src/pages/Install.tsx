import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Instalar App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Check className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">App já está instalado!</p>
              <p className="text-muted-foreground text-sm">
                Abra pela tela inicial do seu dispositivo.
              </p>
            </div>
          ) : (
            <>
              {deferredPrompt ? (
                <div className="flex flex-col items-center gap-4">
                  <Button onClick={handleInstall} size="lg" className="gap-2">
                    <Download className="h-5 w-5" />
                    Instalar agora
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">iPhone / iPad</p>
                      <p className="text-sm text-muted-foreground">
                        Abra no Safari → toque em <strong>Compartilhar</strong> (ícone ↑) → <strong>Adicionar à Tela de Início</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">Android</p>
                      <p className="text-sm text-muted-foreground">
                        Abra no Chrome → toque no menu (⋮) → <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">PC (Chrome / Edge)</p>
                      <p className="text-sm text-muted-foreground">
                        Clique no ícone de instalação (⊕) na barra de endereço do navegador
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
