import { useEffect, useMemo } from 'react';
import { getProvider, listProviders } from '../providers';
import { shouldAskFirst } from '../providers/shared/askFlow';
import { generateIdeas as generateProviderIdeas } from '../providers/shared/multiIdea';
import { CenterDashboard } from './layout/CenterDashboard';
import { LeftRail } from './layout/LeftRail';
import { RightInspector } from './layout/RightInspector';
import { Shell } from './layout/Shell';
import { StatusBar } from './layout/StatusBar';
import { TopBar } from './layout/TopBar';
import { createChatTurn, createIdeaDraft, useV2Store } from './state/store';
import type { Attachment } from './state/types';

function digest(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export default function App() {
  const {
    theme,
    project,
    activeProviderId,
    providerStatuses,
    chatTurns,
    ideas,
    activeIdeaId,
    workspace,
    runState,
    statusText,
    setTheme,
    patchDraft,
    setProvider,
    setProviderStatus,
    addTurn,
    upsertIdea,
    setIdeas,
    setActiveIdea,
    setWorkspace,
    setRunState,
    setDesignMd,
  } = useV2Store();

  useEffect(() => {
    document.documentElement.dataset.designmeTheme = theme;
  }, [theme]);

  useEffect(() => {
    listProviders().forEach((provider) => {
      setProviderStatus(provider.id, 'checking');
      void provider
        .status()
        .then((status) => setProviderStatus(provider.id, status))
        .catch(() => setProviderStatus(provider.id, 'error'));
    });
  }, [setProviderStatus]);

  const activeIdea = ideas.find((idea) => idea.id === activeIdeaId) ?? ideas[0];
  const output = activeIdea?.designOutput;

  async function generateIdeas(prompt = project.draft.prompt) {
    const promptDigest = digest(prompt);
    setRunState('generating', `Generando 3 ideas con ${activeProviderId}`);
    const controller = new AbortController();
    const pendingIdeas = [0, 1, 2].map((variantIndex) =>
      createIdeaDraft({
        sessionId: project.id,
        variantIndex,
        title: ['Minimal editorial', 'Bold campaign', 'Dense professional'][variantIndex],
        providerId: activeProviderId,
        promptDigest,
      }),
    );
    setIdeas(pendingIdeas);
    setActiveIdea(pendingIdeas[0]?.id);
    try {
      const nextIdeas = await generateProviderIdeas({
        sessionId: project.id,
        providerId: activeProviderId,
        buildInput: { ...project.draft, prompt },
        workspace,
        signal: controller.signal,
        onIdea: upsertIdea,
      });
      setIdeas(nextIdeas);
      setActiveIdea(nextIdeas[0]?.id);
      addTurn(
        createChatTurn('assistant', `Generadas ${nextIdeas.length} variantes: ${nextIdeas.map((idea) => idea.title).join(', ')}.`, {
          ideas: nextIdeas.map((idea) => idea.id),
        }),
      );
      setRunState('ready', 'Variantes listas');
    } catch (error) {
      setRunState('error', error instanceof Error ? error.message : 'Error generando ideas');
    }
  }

  async function sendChat(text: string, attachments?: Attachment[]) {
    if (text.startsWith('/clear')) {
      useV2Store.getState().setTurns([]);
      setRunState('idle', 'Chat limpio');
      return;
    }
    if (text.startsWith('/theme')) {
      setTheme(text.includes('light') ? 'light' : 'dark');
      return;
    }
    patchDraft({ prompt: text });
    addTurn(createChatTurn('user', text, { attachments }));
    const provider = getProvider(activeProviderId);
    if ((text.startsWith('/ask') || shouldAskFirst(text)) && provider.ask) {
      setRunState('asking', 'Preguntando antes de generar');
      const response = await provider.ask({ prompt: text.replace(/^\/ask\s*/, ''), workspace, signal: new AbortController().signal });
      if (response.questions.length > 0) {
        addTurn(
          createChatTurn('assistant', 'Antes de generar, necesito afinar esto:', {
            askQuestions: response.questions,
          }),
        );
        setRunState('ready', 'Preguntas listas');
        return;
      }
    }
    void generateIdeas(text);
  }

  function deleteIdea(id: string) {
    const nextIdeas = ideas.filter((idea) => idea.id !== id);
    setIdeas(nextIdeas);
    setActiveIdea(nextIdeas[0]?.id);
  }

  function importWorkspacePlaceholder() {
    setWorkspace({
      files: [],
      stats: { fileCount: 0, bytes: 0 },
      summary: 'Workspace IPC llega en base 3.',
    });
    setRunState('ready', 'Workspace placeholder conectado');
  }

  const tokenCount = useMemo(() => chatTurns.reduce((count, turn) => count + turn.text.length, 0), [chatTurns]);

  return (
    <Shell
      theme={theme}
      topBar={
        <TopBar
          activeProviderId={activeProviderId}
          providerStatuses={providerStatuses}
          projectTitle={project.title}
          theme={theme}
          onProviderChange={setProvider}
          onThemeChange={setTheme}
          onOpenProjects={() => setRunState('ready', 'Sessions drawer llega en base 4')}
        />
      }
      left={
        <LeftRail
          turns={chatTurns}
          running={runState === 'generating'}
          onSend={(text, attachments) => void sendChat(text, attachments)}
          onStop={() => setRunState('idle', 'Generación detenida')}
        />
      }
      center={
        <CenterDashboard
          ideas={ideas}
          activeIdeaId={activeIdeaId}
          onSelectIdea={setActiveIdea}
          onGenerate={() => void generateIdeas()}
          onDeleteIdea={deleteIdea}
        />
      }
      right={
        <RightInspector
          activeIdea={activeIdea}
          designMd={project.designMd}
          output={output}
          tweaks={project.draft.tweaks}
          workspace={workspace}
          onDesignMdChange={setDesignMd}
          onImportWorkspace={importWorkspacePlaceholder}
          onPatchTweaks={(tweaks) => patchDraft({ tweaks })}
          onRescanWorkspace={importWorkspacePlaceholder}
        />
      }
      status={<StatusBar ideaCount={ideas.length} state={runState} text={statusText} tokenCount={tokenCount} />}
    />
  );
}
