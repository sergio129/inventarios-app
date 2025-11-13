'use client';

import { useEffect } from 'react';

export default function FullscreenManager() {
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        const element = document.documentElement;
        
        // Intentar entrar en fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE11
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen no disponible o fue rechazado:', error);
      }
    };

    // Solicitar fullscreen después de que el usuario interactúe (por políticas de seguridad del navegador)
    const handleUserInteraction = async () => {
      await requestFullscreen();
      // Remover listeners después de primera interacción
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // Agregar listeners para primera interacción del usuario
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return null;
}
