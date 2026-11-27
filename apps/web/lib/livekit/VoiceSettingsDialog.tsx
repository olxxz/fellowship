"use client";

import { Modal } from "@fellowship/ui";
import { useEffect, useRef, useState } from "react";
import styles from "@/components/account/Settings.module.sass";
import { useVoice } from "./VoiceProvider";

const LABEL: Record<MediaDeviceKind, string> = { audioinput: "Microfone", audiooutput: "Saída de áudio", videoinput: "Câmera" };

/** Configurações de voz e vídeo: aparelhos, supressor de ruído, processamento do navegador e um medidor do microfone. */
export function VoiceSettingsDialog() {
  const voice = useVoice();
  const { settingsOpen, refreshDevices } = voice;
  const [level, setLevel] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (settingsOpen) void refreshDevices();
  }, [settingsOpen, refreshDevices]);

  // Medidor: só faz sentido conectado (o nível vem do LiveKit).
  useEffect(() => {
    if (!settingsOpen || voice.status !== "on") return;
    const tick = () => {
      setLevel(voice.micLevel());
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [settingsOpen, voice.status, voice]);

  // Safari e Firefox não deixam escolher a saída pelo site.
  const canPickOutput = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
  const kinds: MediaDeviceKind[] = canPickOutput ? ["audioinput", "audiooutput", "videoinput"] : ["audioinput", "videoinput"];

  return (
    <Modal open={settingsOpen} onOpenChange={voice.setSettingsOpen} title="Voz e vídeo">
      <div className={styles.dialogSection}>
        {kinds.map((kind) => (
          <label key={kind} className={styles.field}>
            <span className={styles.label}>{LABEL[kind]}</span>
            <select className={styles.input} value={voice.devices.selected[kind]} onChange={(e) => voice.setDevice(kind, e.target.value)}>
              <option value="">Padrão do sistema</option>
              {voice.devices[kind]
                .filter((d) => d.deviceId && d.deviceId !== "default")
                .map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `${LABEL[kind]} ${i + 1}`}
                  </option>
                ))}
            </select>
          </label>
        ))}

        {voice.status === "on" && (
          <div className={styles.field}>
            <span className={styles.label}>Teste do microfone</span>
            <div className={styles.meter} role="meter" aria-label="Nível do microfone" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
              <span style={{ width: `${Math.min(100, level * 140)}%` }} />
            </div>
            <span className={styles.help}>Fale: a barra deve mexer. Se não mexer, troque o microfone acima.</span>
          </div>
        )}

        <label className={styles.switchRow}>
          <input type="checkbox" checked={voice.krisp && voice.krispSupported} disabled={!voice.krispSupported} onChange={(e) => voice.setKrisp(e.target.checked)} />
          <span className={styles.field}>
            <span className={styles.label}>Supressor de ruído</span>
            <span className={styles.help}>
              {voice.krispSupported ? "Tira teclado, ventilador e barulho de fundo da sua voz (Krisp)." : "Indisponível neste navegador."}
            </span>
          </span>
        </label>

        <label className={styles.switchRow}>
          <input type="checkbox" checked={voice.browserProcessing} onChange={(e) => voice.setBrowserProcessing(e.target.checked)} />
          <span className={styles.field}>
            <span className={styles.label}>Processamento do navegador</span>
            <span className={styles.help}>
              Cancelamento de eco, redução de ruído e volume automático do navegador. Se o som do computador fica abafado quando você entra na chamada, teste desligado (use fone para não dar eco).
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
