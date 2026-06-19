import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';

export default function IdleTimer({ timeoutMinutes = 5, warningMinutes = 4 }) {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const resetTimer = () => {
    // Si la advertencia está en pantalla, no reiniciamos solo por mover el mouse.
    // El usuario debe hacer clic explícitamente en "Seguir conectado".
    if (showWarning) return;

    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft((timeoutMinutes - warningMinutes) * 60);

      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            clearTimeout(idleTimerRef.current);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    idleTimerRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  };

  const handleKeepSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    
    resetTimer();

    // Limitamos la frecuencia de ejecución para no sobrecargar el navegador
    let throttleTimer;
    const handleEvent = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000);
    };

    events.forEach(event => window.addEventListener(event, handleEvent));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleEvent));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
      clearInterval(countdownIntervalRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [user, showWarning, timeoutMinutes, warningMinutes]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-white/10 ring-1 ring-white/5">
        <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Aviso de inactividad</h3>
        <p className="text-gray-400 mb-6 text-sm">
          Por tu seguridad, cerraremos tu sesión en <span className="font-bold text-red-400">{timeLeft} segundos</span> si no hay actividad.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión ahora
          </button>
          <button
            onClick={handleKeepSession}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  );
}
