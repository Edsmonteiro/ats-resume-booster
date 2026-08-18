import { Link } from "@tanstack/react-router";

export function Rodape() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md">
          As análises são geradas por IA e servem como orientação — revise antes de enviar seu
          currículo.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/planos" className="hover:text-foreground">
            Planos
          </Link>
          <Link to="/guia-ats" className="hover:text-foreground">
            Guia ATS
          </Link>
          <Link to="/ia" className="hover:text-foreground">
            Como usamos IA
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/termos" className="hover:text-foreground">
            Termos de uso
          </Link>
        </nav>
      </div>
    </footer>
  );
}
