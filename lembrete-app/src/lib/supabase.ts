
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Tipagem para os lembretes (corresponde ao schema do banco)
export interface Reminder {
  id: string; // UUID gerado pelo Supabase ou ID local temporário
  user_id?: string; // UUID do usuário Supabase (opcional para localStorage)
  task: string;
  location_name: string; // Nome do campo no Supabase
  address: string;
  frequency: 'once' | 'daily' | 'weekly';
  notes: string;
  coordinates: [number, number]; // [longitude, latitude]
  created_at?: string; // Gerado pelo Supabase
  updated_at?: string; // Gerado pelo Supabase
}

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL ou Chave Anon não definidas nas variáveis de ambiente.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// --- Funções CRUD para Lembretes ---

// Função para buscar lembretes (Supabase ou localStorage)
export const getReminders = async (userId: string | null | undefined): Promise<{ data: Reminder[] | null; error: any }> => {
  if (userId) {
    // Usuário logado: Buscar do Supabase
    console.log("Buscando lembretes do Supabase para userId:", userId);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar lembretes do Supabase:', error);
    }
    return { data, error };
  } else {
    // Usuário não logado: Buscar do localStorage
    console.log("Buscando lembretes do localStorage");
    try {
      const localData = localStorage.getItem('reminders');
      const data = localData ? JSON.parse(localData) : [];
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar lembretes do localStorage:', error);
      return { data: [], error }; // Retorna array vazio em caso de erro
    }
  }
};

// Função para adicionar um novo lembrete (Supabase ou localStorage)
export const addReminder = async (
  reminderData: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>, // Recebe dados sem ID/timestamps
  userId: string | null | undefined // Recebe userId (pode ser null/undefined se não logado)
): Promise<{ data: Reminder | null; error: any }> => {
  if (userId) {
    // Usuário logado: Salvar no Supabase
    console.log("Salvando lembrete no Supabase para userId:", userId);
    const { data, error } = await supabase
      .from('reminders')
      .insert([{ ...reminderData, user_id: userId }]) // Garante que user_id está presente
      .select()
      .single(); // Retorna o registro inserido

    if (error) {
      console.error('Erro ao salvar lembrete no Supabase:', error);
      return { data: null, error };
    }
    console.log("Lembrete salvo no Supabase:", data);
    return { data, error: null };

  } else {
    // Usuário não logado: Salvar no localStorage
    console.log("Salvando lembrete no localStorage");
    try {
      const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      // Gerar um ID local temporário (UUID seria melhor, mas timestamp serve para exemplo)
      const newReminderWithId: Reminder = {
        ...reminderData,
        id: `local-${Date.now().toString()}`, // ID local
        // user_id não é definido aqui
      };
      const updatedReminders = [...existingReminders, newReminderWithId];
      localStorage.setItem('reminders', JSON.stringify(updatedReminders));
      console.log("Lembrete salvo no localStorage:", newReminderWithId);
      // Retornar o lembrete salvo localmente para consistência
      return { data: newReminderWithId, error: null };
    } catch (error) {
      console.error('Erro ao salvar lembrete no localStorage:', error);
      return { data: null, error };
    }
  }
};

// Função para excluir um lembrete (Supabase ou localStorage)
export const deleteReminder = async (id: string, userId: string | null | undefined): Promise<{ error: any }> => {
  if (userId) {
    // Usuário logado: Excluir do Supabase
    console.log("Excluindo lembrete do Supabase:", id);
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Garante que só pode excluir seus próprios lembretes

    if (error) {
      console.error('Erro ao excluir lembrete do Supabase:', error);
    }
    return { error };
  } else {
    // Usuário não logado: Excluir do localStorage
    console.log("Excluindo lembrete do localStorage:", id);
    try {
      const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      const updatedReminders = existingReminders.filter((reminder: Reminder) => reminder.id !== id);
      localStorage.setItem('reminders', JSON.stringify(updatedReminders));
      return { error: null };
    } catch (error) {
      console.error('Erro ao excluir lembrete do localStorage:', error);
      return { error };
    }
  }
};

// (Opcional) Função para atualizar um lembrete (poderia ser adicionada)
// export const updateReminder = async (...) => { ... };

