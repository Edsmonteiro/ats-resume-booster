import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { EntradaHistorico } from "@/components/historico-analises";
import type { Vaga } from "@/components/vagas-panel";
import type { AtsAnalysis } from "@/lib/ats.functions";
import { useAuth } from "@/lib/auth";
import { carregarDados, salvarDados, type DadosUsuario } from "@/lib/dados.functions";
import { useLocalState } from "@/lib/use-local-state";

type Estado = {
  curriculo: string;
  analise: AtsAnalysis | null;
  historico: EntradaHistorico[];
  vagas: Vaga[];
};

function temConteudo(e: Estado) {
  return Boolean(e.curriculo.trim() || e.analise || e.historico.length || e.vagas.length);
}

export function useDadosApp() {
  const { user, carregando: carregandoAuth } = useAuth();

  const [curriculo, setCurriculoLocal] = useLocalState<string>("cvradar.curriculo", "");
  const [analise, setAnaliseLocal] = useLocalState<AtsAnalysis | null>("cvradar.analise", null);
  const [historico, setHistoricoLocal] = useLocalState<EntradaHistorico[]>("cvradar.historico", []);
  const [vagas, setVagasLocal] = useLocalState<Vaga[]>("cvradar.vagas", []);

  const [sincronizando, setSincronizando] = useState(false);
  const estadoRef = useRef<Estado>({ curriculo, analise, historico, vagas });
  estadoRef.current = { curriculo, analise, historico, vagas };

  const prontoRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enviar = useCallback((estado: Estado) => {
    const payload: DadosUsuario = {
      curriculo: estado.curriculo,
      analise: (estado.analise ?? null) as DadosUsuario["analise"],
      historico: estado.historico as unknown as DadosUsuario["historico"],
      vagas: estado.vagas as unknown as DadosUsuario["vagas"],
    };
    return salvarDados({ data: payload });
  }, []);

  // Ao entrar na conta: puxa da nuvem ou migra o que estava só no navegador.
  useEffect(() => {
    prontoRef.current = false;
    if (carregandoAuth || !user) return;

    let ativo = true;
    setSincronizando(true);

    void (async () => {
      try {
        const nuvem = await carregarDados();
        if (!ativo) return;

        const local = estadoRef.current;
        const nuvemVazia =
          !nuvem ||
          !temConteudo({
            curriculo: nuvem.curriculo,
            analise: nuvem.analise as AtsAnalysis | null,
            historico: (nuvem.historico ?? []) as unknown as EntradaHistorico[],
            vagas: (nuvem.vagas ?? []) as unknown as Vaga[],
          });

        if (nuvemVazia && temConteudo(local)) {
          await enviar(local);
          if (ativo) toast.success("Seus dados foram migrados para a sua conta.");
        } else if (nuvem) {
          setCurriculoLocal(nuvem.curriculo ?? "");
          setAnaliseLocal((nuvem.analise ?? null) as AtsAnalysis | null);
          setHistoricoLocal((nuvem.historico ?? []) as unknown as EntradaHistorico[]);
          setVagasLocal((nuvem.vagas ?? []) as unknown as Vaga[]);
        }
      } catch {
        if (ativo) toast.error("Não foi possível sincronizar seus dados agora.");
      } finally {
        if (ativo) {
          prontoRef.current = true;
          setSincronizando(false);
        }
      }
    })();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, carregandoAuth]);

  const agendarSalvar = useCallback(() => {
    if (!user || !prontoRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSincronizando(true);
      void enviar(estadoRef.current)
        .catch(() => toast.error("Não foi possível salvar na sua conta."))
        .finally(() => setSincronizando(false));
    }, 800);
  }, [user, enviar]);

  const setCurriculo = useCallback(
    (v: string) => {
      setCurriculoLocal(v);
      estadoRef.current = { ...estadoRef.current, curriculo: v };
      agendarSalvar();
    },
    [setCurriculoLocal, agendarSalvar],
  );

  const setAnalise = useCallback(
    (v: AtsAnalysis | null) => {
      setAnaliseLocal(v);
      estadoRef.current = { ...estadoRef.current, analise: v };
      agendarSalvar();
    },
    [setAnaliseLocal, agendarSalvar],
  );

  const setHistorico = useCallback(
    (v: EntradaHistorico[]) => {
      setHistoricoLocal(v);
      estadoRef.current = { ...estadoRef.current, historico: v };
      agendarSalvar();
    },
    [setHistoricoLocal, agendarSalvar],
  );

  const setVagas = useCallback(
    (v: Vaga[]) => {
      setVagasLocal(v);
      estadoRef.current = { ...estadoRef.current, vagas: v };
      agendarSalvar();
    },
    [setVagasLocal, agendarSalvar],
  );

  return {
    curriculo,
    setCurriculo,
    analise,
    setAnalise,
    historico,
    setHistorico,
    vagas,
    setVagas,
    sincronizando,
    naNuvem: Boolean(user),
  };
}
