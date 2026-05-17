import { useEffect, useMemo } from 'react';
import { buildDesignProject } from '../engine';
import { listProviders } from '../providers';
import { CenterDashboard } from './layout/CenterDashboard';
import { LeftRail } from './layout/LeftRail';
import { RightInspector } from './layout/RightInspector';
import { Shell } from './layout/Shell';
import { StatusBar } from './layout/StatusBar';
import { TopBar } from './layout/TopBar';
import { createChatTurn, createIdeaDraft, useV2Store } from './state/store';
import type { Attachment, Idea } from './state/types';

const variants = [
  { title: 'Minimal editorial', prompt: 'Minimal/editorial variant. Calm hierarchy, sharp whitespace.' },
  { title: 'Bold campaign', prompt: 'Bold/campaign variant. Strong contrast, memorable hero moments.' },
  { title: 'Dense professional', prompt: 'Dense/professional variant. Scannable data, compact operations UI.' },
];

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

  function generateIdeas(prompt = project.draft.prompt) {
    const promptDigest = digest(prompt);
    setRunState('generating', `Generando 3 ideas con ${activeProviderId}`);
    const nextIdeas: Idea[] = variants.map((variant, variantIndex) => {
      const draft = createIdeaDraft({
        sessionId: project.id,
        variantIndex,
        title: variant.title,
        providerId: activeProviderId,
        promptDigest,
      });
      const designOutput = buildDesignProject({
        ...project.draft,
        prompt: `${prompt}\n\nVariant direction: ${variant.prompt}`,
      });
      return {
        ...draft,
        status: 'ready',
        html: designOutput.html,
        designOutput,
      };
    });
    setIdeas(nextIdeas);
    setActiveIdea(nextIdeas[0]?.id);
    addTurn(
      createChatTurn('assistant', `Generadas ${nextIdeas.length} variantes: ${nextIdeas.map((idea) => idea.title).join(', ')}.`, {
        ideas: nextIdeas.map((idea) => idea.id),
      }),
    );
    setRunState('ready', 'Variantes listas');
  }

  function sendChat(text: string, attachments?: Attachment[]) {
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
    generateIdeas(text);
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
      left={<LeftRail turns={chatTurns} running={runState === 'generating'} onSend={sendChat} onStop={() => setRunState('idle', 'Generación detenida')} />}
      center={
        <CenterDashboard
          ideas={ideas}
          activeIdeaId={activeIdeaId}
          onSelectIdea={setActiveIdea}
          onGenerate={() => generateIdeas()}
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
