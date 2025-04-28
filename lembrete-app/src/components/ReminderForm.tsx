
'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Definindo o token do Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoib3NlYXNiYXN0byIsImEiOiJjbTl6bDNxa2cxdTE2MmpwdzlkMWtidTc3In0.8qBbzpsVy0eG-NJqJb_KxA';

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

// Props para o componente
interface ReminderFormProps {
  onReminderSaved: () => void; // Callback para notificar que um lembrete foi salvo
}

export function ReminderForm({ onReminderSaved }: ReminderFormProps) {
  // Estados para os campos do formulário
  const [task, setTask] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly'>('once');
  const [notes, setNotes] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Inicializar o mapa quando o componente for montado
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-46.6333, -23.5505], // São Paulo como centro padrão
        zoom: 12
      });
      mapRef.current = map;

      // Adicionar controles de navegação
      map.addControl(new mapboxgl.NavigationControl());
      
      // Adicionar um marcador que pode ser arrastado
      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([-46.6333, -23.5505])
        .addTo(map);
      markerRef.current = marker;
        
      // Atualizar as coordenadas quando o marcador for arrastado
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setCoordinates([lngLat.lng, lngLat.lat]);
        
        // Fazer geocodificação reversa para obter o endereço
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}`)
          .then(response => response.json())
          .then(data => {
            if (data.features && data.features.length > 0) {
              setAddress(data.features[0].place_name);
            }
          });
      });
    }

    // Limpar o mapa ao desmontar
    return () => {
        mapRef.current?.remove();
        mapRef.current = null;
    };
  }, []);

  // Função para buscar endereços no Mapbox
  const searchAddress = async (query: string) => {
    if (!query) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR` // Adicionado filtro para Brasil
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features);
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para selecionar um resultado da busca
  const selectSearchResult = (result: any) => {
    setAddress(result.place_name);
    setCoordinates(result.center as [number, number]);
    setSearchResults([]);
    
    // Atualizar o mapa com a nova localização
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({
        center: result.center,
        zoom: 15
      });
      markerRef.current.setLngLat(result.center);
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !locationName || !address || !coordinates) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione um local no mapa.');
      return;
    }
    
    // Criar um novo lembrete
    const newReminder: Reminder = {
      id: Date.now().toString(), // Usar ID temporário, Supabase gerará um ID real
      task,
      locationName,
      address,
      frequency,
      notes,
      coordinates
    };
    
    // Salvar no localStorage (será substituído por Supabase)
    const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    localStorage.setItem('reminders', JSON.stringify([...existingReminders, newReminder]));
    
    // Limpar o formulário
    setTask('');
    setLocationName('');
    setAddress('');
    setFrequency('once');
    setNotes('');
    setCoordinates(null);
    setSearchResults([]);
    // Resetar mapa para posição inicial?
    // mapRef.current?.flyTo({ center: [-46.6333, -23.5505], zoom: 12 });
    // markerRef.current?.setLngLat([-46.6333, -23.5505]);

    // Notificar o componente pai que um lembrete foi salvo
    onReminderSaved(); 
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
          📝 Tarefa
        </label>
        <textarea
          id="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Descrição da tarefa a ser realizada ao chegar"
          required
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">📍 Local</h3>
        
        <div className="mb-2">
          <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do local
          </label>
          <input
            type="text"
            id="locationName"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Casa, Trabalho, Mercado"
            required
          />
        </div>
        
        <div className="mb-2 relative">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              // Debounce search?
              if (e.target.value.length > 3) {
                searchAddress(e.target.value);
              } else {
                setSearchResults([]);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite um endereço para buscar ou arraste o marcador"
            required
          />
          
          {/* Resultados da busca */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => selectSearchResult(result)}
                >
                  {result.place_name}
                </div>
              ))}
            </div>
          )}
          
          {isSearching && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
        </div>
        
        {/* Container do mapa */}
        <div ref={mapContainerRef} id="map" className="w-full h-64 rounded-md mt-4 mb-4 border border-gray-300"></div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">⏰ Notificação</h3>
        
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="enableNotification"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked // Sempre checado por enquanto
            readOnly
          />
          <label htmlFor="enableNotification" className="ml-2 block text-sm text-gray-700">
            Acionar lembrete ao chegar no local (raio de 100m)
          </label>
        </div>
        
        <div className="mb-2">
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
            Frequência
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'once' | 'daily' | 'weekly')}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="once">Uma vez</option>
            {/* <option value="daily">Diariamente</option> */}
            {/* <option value="weekly">Semanalmente</option> */}
            {/* Frequências adicionais desabilitadas temporariamente */}
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          ✨ Observações
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Inserir informações extras se necessário"
          rows={2}
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Salvar Lembrete
      </button>
    </form>
  );
}

