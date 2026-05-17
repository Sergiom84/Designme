import {
  artifactOptions,
  buildDesignProject,
  defaultTweaks,
  designDirections,
  type ArtifactType,
  type BuildInput,
  type DesignOutput,
  type DirectionId,
} from '../../../src/engine/index';

export const canonicalPrompts: Record<ArtifactType, string> = {
  software:
    'Software local-first para equipos de operaciones B2B que prioriza tareas bloqueadas, responsables y estados de entrega.',
  web: 'Web de producto para una herramienta de analitica de ventas con prueba social, propuesta clara y solicitud de demo.',
  dashboard: 'Dashboard para un CRM de ventas B2B con pipeline, riesgos, deals bloqueados y siguientes acciones.',
  mobile:
    'App movil para coordinadores de campo que necesitan revisar rutas, incidencias, checklist diario y confirmaciones rapidas.',
  deck: 'Deck comercial para presentar una plataforma de automatizacion financiera a direccion, con problema, traccion y siguiente paso.',
  infographic:
    'Infografia explicativa sobre eficiencia energetica en edificios, con pasos, metricas clave y recomendaciones accionables.',
};

export interface GeneratedArtifactCase {
  artifactType: ArtifactType;
  directionId: DirectionId;
  name: string;
  input: BuildInput;
}

export const generatedArtifactCases: GeneratedArtifactCase[] = artifactOptions.flatMap((artifact) =>
  designDirections.map((direction) => ({
    artifactType: artifact.id,
    directionId: direction.id,
    name: `${artifact.id}-${direction.id}`,
    input: {
      prompt: canonicalPrompts[artifact.id],
      artifactType: artifact.id,
      directionId: direction.id,
      tweaks: defaultTweaks,
    },
  })),
);

export function buildGeneratedArtifact(testCase: GeneratedArtifactCase): DesignOutput {
  return buildDesignProject(testCase.input);
}
