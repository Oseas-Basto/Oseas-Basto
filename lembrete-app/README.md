# Lembre-me App - Protótipo Web Funcional

Este é um protótipo web funcional de um aplicativo de lembretes baseado em localização, inspirado no site Lembre-me e desenvolvido com Next.js, Mapbox e Supabase.

## Funcionalidades

*   **Criação de Lembretes:** Adicione tarefas a serem lembradas ao chegar em um local específico.
*   **Seleção de Localização:**
    *   Busque endereços usando a API de Geocoding do Mapbox.
    *   Selecione a localização exata arrastando um marcador em um mapa interativo (Mapbox GL JS).
*   **Geofencing:** Receba notificações no navegador quando se aproximar (raio de 100 metros) do local de um lembrete ativo (requer permissão de localização e notificação).
*   **Autenticação:** Login seguro via Magic Link (e-mail) usando Supabase Auth.
*   **Sincronização na Nuvem:** Seus lembretes são salvos e sincronizados com segurança no banco de dados Supabase quando você está logado.
*   **Funcionamento Offline (Parcial):** Lembretes criados sem login são salvos localmente (localStorage) e sincronizados com a nuvem na próxima vez que você fizer login.
*   **Interface Responsiva:** Design adaptado para funcionar bem em navegadores de dispositivos móveis (especialmente iOS).

## Tecnologias Utilizadas

*   **Framework:** Next.js 15+
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS
*   **Mapas e Geocoding:** Mapbox GL JS & Mapbox Geocoding API
*   **Banco de Dados e Autenticação:** Supabase (PostgreSQL, Auth)
*   **Geofencing:** API de Geolocalização do Navegador + Cálculo de Distância (Haversine)
*   **Notificações:** API de Notificações do Navegador

## Configuração do Projeto

### Pré-requisitos

*   Node.js (versão 20.x ou superior)
*   npm (geralmente vem com o Node.js)
*   Uma conta Mapbox para obter um token de acesso.
*   Uma conta Supabase para criar um projeto (banco de dados e autenticação).

### Passos

1.  **Clonar o Repositório (se aplicável):**
    ```bash
    git clone <url-do-repositorio>
    cd lembrete-app
    ```
    *Observação: Se você recebeu este código como um arquivo zip, descompacte-o e navegue até o diretório `lembrete-app`.*

2.  **Instalar Dependências:**
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo chamado `.env.local` na raiz do projeto (`/home/ubuntu/lembrete-app`) e adicione as seguintes variáveis, substituindo os valores pelos seus tokens e URLs:

    ```plaintext
    NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoib3NlYXNiYXN0byIsImEiOiJjbTl6bDNxa2cxdTE2MmpwdzlkMWtidTc3In0.8qBbzpsVy0eG-NJqJb_KxA
    NEXT_PUBLIC_SUPABASE_URL=https://dskdfyfocrixhglniuhk.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza2RmeWZvY3JpeGhnbG5pdWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA0OTksImV4cCI6MjA2MTI3NjQ5OX0.5RWGxvu4Gtjmu6ykqMCSHEUMjaRuUMvNdulDcfz4Yjs
    ```
    *Nota: Os valores acima são os que você forneceu. Mantenha-os seguros.*

4.  **Configurar o Banco de Dados Supabase:**
    *   Acesse seu projeto no painel do Supabase ([app.supabase.com](https://app.supabase.com/)).
    *   Vá para a seção "SQL Editor" no menu lateral.
    *   Clique em "New query".
    *   Copie todo o conteúdo do arquivo `migrations/0002_create_reminders.sql` (localizado em `/home/ubuntu/lembrete-app/migrations/`) e cole no editor.
    *   Clique em "RUN". Isso criará a tabela `reminders` com as colunas e políticas de segurança necessárias.

5.  **Configurar Autenticação Supabase (Magic Link):**
    *   No painel do Supabase, vá para "Authentication" -> "Providers".
    *   Certifique-se de que o provedor "Email" está habilitado.
    *   (Opcional) Em "Authentication" -> "Settings" -> "Email Templates", você pode personalizar o e-mail de Magic Link enviado aos usuários.

## Executando o Aplicativo

1.  **Iniciar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```

2.  **Acessar o Aplicativo:**
    Abra seu navegador e acesse [http://localhost:3000](http://localhost:3000) (ou a porta indicada no terminal, caso a 3000 esteja em uso).

## Implantação (Deployment)

Este aplicativo Next.js pode ser implantado em várias plataformas, como:

*   **Vercel:** Plataforma otimizada para Next.js (recomendado).
*   **Netlify:** Outra opção popular para sites estáticos e Jamstack.
*   **Cloudflare Pages:** Boa integração se você já usa outros serviços Cloudflare.

Para implantar, você geralmente precisará conectar seu repositório Git (GitHub, GitLab, Bitbucket) à plataforma escolhida e configurar as variáveis de ambiente (Mapbox e Supabase) nas configurações de implantação da plataforma.

## Considerações

*   **Geofencing:** A precisão e a frequência da atualização da localização dependem do navegador e do dispositivo do usuário. O geofencing funciona melhor quando o navegador está ativo.
*   **Notificações:** O usuário precisa conceder permissão para receber notificações.
*   **Frequência:** Atualmente, apenas a frequência "Uma vez" está habilitada no formulário. O código de geofencing e a estrutura do banco de dados suportam outras frequências (`daily`, `weekly`), mas a lógica para reativar lembretes diários/semanais precisaria ser implementada (possivelmente usando funções de background ou verificações periódicas).

