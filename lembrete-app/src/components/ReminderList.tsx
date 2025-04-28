
'use client';

import { useState, useEffect } from 'react';

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
interface ReminderListProps {
  reminders: Reminder[]; // Recebe os lembretes como prop
  onReminderDeleted: (id: string) => void; // Callback para notificar que um lembrete foi excluído
}

export function ReminderList({ reminders, onReminderDeleted }: ReminderListProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Apenas controla o estado de carregamento inicial
  useEffect(() => {
    // Se reminders for passado, consideramos carregado
    if (reminders) {
        setIsLoading(false);
    }
    // A lógica de carregamento agora é feita no componente pai (page.tsx)
  }, [reminders]);

  // Função para excluir um lembrete (agora chama o callback)
  const handleDelete = (id: string) => {
    // Aqui, futuramente, chamaremos a função do Supabase para excluir
    // Por enquanto, apenas notificamos o componente pai via callback
    
    // Simular exclusão no localStorage temporariamente até Supabase
    const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const updatedReminders = existingReminders.filter((reminder: Reminder) => reminder.id !== id);
    localStorage.setItem('reminders', JSON.stringify(updatedReminders));

    onReminderDeleted(id); // Notifica o componente pai para atualizar o estado
  };

  // Função para formatar a frequência em português
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return 'Uma vez';
      case 'daily':
        return 'Diariamente';
      case 'weekly':
        return 'Semanalmente';
      default:
        return frequency;
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando lembretes...</div>;
  }

  if (!reminders || reminders.length === 0) {
    return <div className="text-center py-4 text-gray-500">Nenhum lembrete salvo ainda</div>;
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <div key={reminder.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 break-words mr-2">{reminder.task}</h3>
            <button
              onClick={() => handleDelete(reminder.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors duration-150"
              aria-label="Excluir lembrete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">📍 Local:</span> {reminder.locationName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">🗺️ Endereço:</span> {reminder.address}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">🔄 Frequência:</span> {formatFrequency(reminder.frequency)}
            </p>
            {reminder.notes && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                 <p className="text-sm text-gray-600">
                   <span className="font-medium text-gray-700">✨ Obs:</span> {reminder.notes}
                 </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

