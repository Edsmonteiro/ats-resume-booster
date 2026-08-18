import { useEffect, useState, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { liberado, tierDoPrice, type Recurso, type Tier } from "@/lib/plano";
import { getStripeEnvironment } from "@/lib/stripe";


export type Assinatura = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function ambiente(): "sandbox" | "live" | null {
  try {
    return getStripeEnvironment();
  } catch {
    return null;
  }
}

export function assinaturaAtiva(a: Assinatura | null): boolean {
  if (!a) return false;
  const fim = a.current_period_end ? new Date(a.current_period_end) : null;
  const noPrazo = !fim || fim > new Date();
  if (["active", "trialing", "past_due"].includes(a.status) && noPrazo) return true;
  return a.status === "canceled" && !!fim && fim > new Date();
}

export function useAssinatura() {
  const { user, carregando: carregandoAuth } = useAuth();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [carregando, setCarregando] = useState(true);

  const buscar = useCallback(async () => {
    const env = ambiente();
    if (!user || !env) {
      setAssinatura(null);
      setCarregando(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, price_id, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setAssinatura(data ?? null);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    if (carregandoAuth) return;
    void buscar();
  }, [buscar, carregandoAuth]);

  useEffect(() => {
    if (!user) return;
    const id = Math.random().toString(36).slice(2);
    const canal = supabase.channel(`assinatura-${user.id}-${id}`);
    canal
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => void buscar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [user, buscar]);


  const ativa = assinaturaAtiva(assinatura);
  const tier: Tier = ativa ? tierDoPrice(assinatura?.price_id) : "gratis";

  return {
    assinatura,
    ativa,
    tier,
    temAcessoA: (recurso: Recurso) => liberado(tier, recurso),
    carregando: carregando || carregandoAuth,

    recarregar: buscar,
  };
}
