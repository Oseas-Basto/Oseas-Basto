'use client';

import { useGeofencing } from "@/hooks/useGeofencing";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderList } from "@/components/ReminderList";
import { LoginForm } from "@/components/LoginForm"; // Importar LoginForm
import { useAuth } from "@/hooks/useAuth"; // Importar useAuth
import { useState, useEffect, useCallback, useRef } from "react";
import { getReminders, addReminder, deleteReminder, Reminder, supabase } from "@/lib/supabase"; // Importar funções, tipo e supabase client

export default function Home() {
  const { user, session, loading: authLoading } = useAuth(); // Obter estado de autenticação
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const syncPerformedRef = useRef(false); // Ref para garantir que a sincronização ocorra apenas uma vez por login

  // Função para carregar/recarregar lembretes
  const loadReminders = useCallback(async () => {
    setIsLoadingReminders(true);
    const userId = session?.user?.id;
    const { data, error } = await getReminders(userId);
    if (data) {
      // Ordenar lembretes por data de criação (mais recentes primeiro)
      data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setReminders(data);
    } else {
      console.error("Erro ao carregar lembretes:", error);
      // Manter lembretes existentes se houver erro?
    }
    setIsLoadingReminders(false);
  }, [session]);

  // Efeito para carregar lembretes e sincronizar localStorage com Supabase no login
  useEffect(() => {
    // Só executa se a autenticação não estiver carregando
    if (!authLoading) {
      if (session && !syncPerformedRef.current) {
        // Usuário acabou de fazer login, tentar sincronizar localStorage
        syncPerformedRef.current = true; // Marcar que a sincronização foi tentada
        console.log("Usuário logado, tentando sincronizar localStorage...");

        const syncLocalStorage = async () => {
          const localRemindersString = localStorage.getItem("reminders");
          if (localRemindersString) {
            let localReminders: Reminder[] = [];
            try {
              localReminders = JSON.parse(localRemindersString);
            } catch (e) {
              console.error("Erro ao parsear lembretes do localStorage:", e);
              localStorage.removeItem("reminders"); // Limpar dados inválidos
              loadReminders(); // Carregar do Supabase
              return;
            }

            if (localReminders.length > 0) {
              console.log(`Encontrados ${localReminders.length} lembretes no localStorage para sincronizar.`);
              
              // Buscar IDs existentes no Supabase para evitar duplicatas exatas
              const { data: supabaseIdsData, error: idError } = await supabase
                .from("reminders")
                .select("id")
                .eq("user_id", session.user.id);

              const supabaseIds = new Set(supabaseIdsData?.map(r => r.id) || []);

              const remindersToSync = localReminders.filter(localReminder => 
                !supabaseIds.has(localReminder.id) // Sincroniza apenas se o ID não existir no Supabase
              );

              if (remindersToSync.length > 0) {
                 console.log(`Sincronizando ${remindersToSync.length} novos lembretes do localStorage para o Supabase...`);
                 const syncPromises = remindersToSync.map(reminder => {
                    // Remover o ID gerado localmente se a coluna id for auto-gerada no Supabase
                    // No nosso caso, o ID é UUID gerado pelo Supabase por padrão, então não enviamos o ID local.
                    // No entanto, nossa função addReminder espera um Omit<Reminder, 'id'>, então está correto.
                    // Precisamos garantir que user_id seja adicionado.
                    const { id, created_at, updated_at, ...rest } = reminder; // Remover campos gerenciados pelo DB
                    return addReminder({ ...rest, user_id: session.user.id }, session.user.id);
                 });

                 try {
                    await Promise.all(syncPromises);
                    console.log("Sincronização do localStorage concluída.");
                    localStorage.removeItem("reminders"); // Limpar localStorage após sincronização bem-sucedida
                 } catch (syncError) {
                    console.error("Erro durante a sincronização do localStorage:", syncError);
                    // Não limpar localStorage se a sincronização falhar?
                    // Ou tentar novamente mais tarde?
                 }
              } else {
                console.log("Nenhum lembrete novo para sincronizar do localStorage.");
                localStorage.removeItem("reminders"); // Limpar se não há nada novo para sincronizar
              }
            }
          }
          // Após a tentativa de sincronização (bem-sucedida ou não), carregar os lembretes do Supabase
          loadReminders();
        };

        syncLocalStorage();

      } else if (!session) {
        // Usuário deslogado, resetar flag de sincronização e carregar do localStorage
        syncPerformedRef.current = false;
        loadReminders(); 
      } else {
        // Usuário já estava logado, apenas carregar do Supabase
        loadReminders();
      }
    }
  }, [authLoading, session, loadReminders]);

  // Usar o hook de geofencing com os lembretes carregados
  const { currentPosition, error: geoError } = useGeofencing(reminders, 100); // Raio de 100 metros

  // Função para adicionar um novo lembrete (passada para ReminderForm)
  const handleAddReminder = async (newReminderData: Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">) => {
    const userId = session?.user?.id;
    // Ajustar os nomes dos campos para corresponder ao schema do Supabase
    const reminderToSave = {
        ...newReminderData,
        location_name: newReminderData.locationName, // Corrigir nome do campo
    };
    delete (reminderToSave as any).locationName; // Remover campo antigo

    const { data, error } = await addReminder(reminderToSave, userId);
    if (error) {
      console.error("Erro ao salvar lembrete:", error);
      alert(`Erro ao salvar lembrete: ${error.message}`);
    } else {
      // Recarregar a lista após salvar
      loadReminders();
    }
  };

  // Função para excluir um lembrete (passada para ReminderList)
  const handleDeleteReminder = async (id: string) => {
    const userId = session?.user?.id;
    const { error } = await deleteReminder(id, userId);
    if (error) {
      console.error("Erro ao excluir lembrete:", error);
      alert(`Erro ao excluir lembrete: ${error.message}`);
    } else {
      // Recarregar a lista após excluir
      loadReminders();
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Lembre-me</h1>

      {/* Componente de Login */}
      <LoginForm />

      {/* Exibir erro de geolocalização, se houver */}
      {geoError && <p className="text-red-500 text-center mb-4">Erro de Geolocalização: {geoError}</p>}

      {/* Só mostra o formulário e a lista se a autenticação estiver carregada */}
      {!authLoading && (
        <>
          <section className="mb-8">
            {/* Passar a função correta para salvar */}
            <ReminderForm onReminderSaved={handleAddReminder} /> 
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Meus Lembretes</h2>
            {isLoadingReminders ? (
              <div className="text-center py-4">Carregando lembretes...</div>
            ) : (
              <ReminderList reminders={reminders} onReminderDeleted={handleDeleteReminder} />
            )}
          </section>
        </>
      )}
       {/* Indicador de carregamento de autenticação */}
       {authLoading && (
         <div className="flex justify-center items-center p-4">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
       )}
    </main>
  );
}
