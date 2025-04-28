
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Definindo a interface para o objeto de lembrete
interface Reminder {
  id: string;
  task: string;
  locationName: string;
  address: string;
  frequency: 'once' | 'daily' | 'weekly';
  notes: string;
  coordinates?: [number, number];
}

// Função para calcular a distância entre duas coordenadas (Haversine formula)
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371e3; // Raio da Terra em metros
  const lat1 = coord1[1] * Math.PI / 180; // φ, λ em radianos
  const lat2 = coord2[1] * Math.PI / 180;
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // em metros
  return distance;
}

// Hook customizado para geofencing
export function useGeofencing(reminders: Reminder[], radius: number = 100) {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggeredReminders = useRef<Set<string>>(new Set()); // Guarda IDs dos lembretes já acionados

  // Função para solicitar permissão de notificação
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações.');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Função para mostrar notificação
  const showNotification = useCallback((reminder: Reminder) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    new Notification(`Lembrete: ${reminder.task}`, {
      body: `Você está perto de ${reminder.locationName}.`,
      icon: '/favicon.ico' // Opcional: adicione um ícone
    });

    // Marcar como acionado (para frequência 'once')
    if (reminder.frequency === 'once') {
        triggeredReminders.current.add(reminder.id);
        // Opcional: Atualizar o estado/localStorage para remover/desativar o lembrete 'once'
    }

  }, []);

  // Efeito para obter a localização do usuário
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada por este navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        setError(null);
      },
      (err) => {
        setError(`Erro ao obter localização: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Limpar o watch quando o componente desmontar
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Efeito para verificar a proximidade dos lembretes
  useEffect(() => {
    if (!currentPosition || reminders.length === 0) {
      return;
    }

    const userCoords: [number, number] = [
      currentPosition.coords.longitude,
      currentPosition.coords.latitude
    ];

    reminders.forEach((reminder) => {
      if (reminder.coordinates && !triggeredReminders.current.has(reminder.id)) {
        const distance = calculateDistance(userCoords, reminder.coordinates);

        if (distance <= radius) {
          console.log(`Entrou no raio do lembrete: ${reminder.task} (Distância: ${distance.toFixed(2)}m)`);
          requestNotificationPermission().then(granted => {
            if (granted) {
              showNotification(reminder);
            }
          });
        }
      }
    });

  }, [currentPosition, reminders, radius, showNotification, requestNotificationPermission]);

  return { currentPosition, error };
}

