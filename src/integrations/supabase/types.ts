export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      analises_publicas: {
        Row: {
          cargo_desejado: string
          created_at: string
          dados: Json
          id: string
          resumo: string
          score: number
          score_antes: number | null
        }
        Insert: {
          cargo_desejado?: string
          created_at?: string
          dados?: Json
          id?: string
          resumo?: string
          score: number
          score_antes?: number | null
        }
        Update: {
          cargo_desejado?: string
          created_at?: string
          dados?: Json
          id?: string
          resumo?: string
          score?: number
          score_antes?: number | null
        }
        Relationships: []
      }
      candidaturas: {
        Row: {
          compatibilidade: number
          created_at: string
          empresa: string
          enviada_em: string | null
          fonte: string
          id: string
          link: string
          local: string
          notas: string
          ordem: number
          proximo_passo_em: string | null
          requisitos: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
          vaga_id: string | null
        }
        Insert: {
          compatibilidade?: number
          created_at?: string
          empresa?: string
          enviada_em?: string | null
          fonte?: string
          id?: string
          link?: string
          local?: string
          notas?: string
          ordem?: number
          proximo_passo_em?: string | null
          requisitos?: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          vaga_id?: string | null
        }
        Update: {
          compatibilidade?: number
          created_at?: string
          empresa?: string
          enviada_em?: string | null
          fonte?: string
          id?: string
          link?: string
          local?: string
          notas?: string
          ordem?: number
          proximo_passo_em?: string | null
          requisitos?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidaturas_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_encontradas"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas: {
        Row: {
          acao: string
          created_at: string
          id: string
          resultado: string
          situacao: string
          tags: string[]
          tarefa: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acao?: string
          created_at?: string
          id?: string
          resultado?: string
          situacao?: string
          tags?: string[]
          tarefa?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          resultado?: string
          situacao?: string
          tags?: string[]
          tarefa?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          aplicado_em_curriculo: boolean
          aprendizados: string
          carga_horaria: string
          concluido_em: string
          created_at: string
          id: string
          instituicao: string
          link: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aplicado_em_curriculo?: boolean
          aprendizados?: string
          carga_horaria?: string
          concluido_em?: string
          created_at?: string
          id?: string
          instituicao?: string
          link?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aplicado_em_curriculo?: boolean
          aprendizados?: string
          carga_horaria?: string
          concluido_em?: string
          created_at?: string
          id?: string
          instituicao?: string
          link?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dados_usuario: {
        Row: {
          analise: Json | null
          created_at: string
          curriculo: string
          historico: Json
          updated_at: string
          user_id: string
          vagas: Json
        }
        Insert: {
          analise?: Json | null
          created_at?: string
          curriculo?: string
          historico?: Json
          updated_at?: string
          user_id: string
          vagas?: Json
        }
        Update: {
          analise?: Json | null
          created_at?: string
          curriculo?: string
          historico?: Json
          updated_at?: string
          user_id?: string
          vagas?: Json
        }
        Relationships: []
      }
      extensao_tokens: {
        Row: {
          created_at: string
          dispositivo: string
          id: string
          revogado: boolean
          token_hash: string
          ultimo_uso_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dispositivo?: string
          id?: string
          revogado?: boolean
          token_hash: string
          ultimo_uso_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dispositivo?: string
          id?: string
          revogado?: boolean
          token_hash?: string
          ultimo_uso_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          dados: Json
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dados?: Json
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dados?: Json
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          cargo_desejado: string | null
          created_at: string
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          cargo_desejado?: string | null
          created_at?: string
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          cargo_desejado?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      preferencias_busca: {
        Row: {
          alerta_frequencia: string
          ativo: boolean
          cargos: string[]
          cidade: string
          contratos: string[]
          created_at: string
          estado: string
          janela_dias: number
          modelos: string[]
          palavras_evitar: string[]
          salario_minimo: number | null
          senioridade: string
          ultimo_alerta_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_frequencia?: string
          ativo?: boolean
          cargos?: string[]
          cidade?: string
          contratos?: string[]
          created_at?: string
          estado?: string
          janela_dias?: number
          modelos?: string[]
          palavras_evitar?: string[]
          salario_minimo?: number | null
          senioridade?: string
          ultimo_alerta_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alerta_frequencia?: string
          ativo?: boolean
          cargos?: string[]
          cidade?: string
          contratos?: string[]
          created_at?: string
          estado?: string
          janela_dias?: number
          modelos?: string[]
          palavras_evitar?: string[]
          salario_minimo?: number | null
          senioridade?: string
          ultimo_alerta_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      preparos_entrevista: {
        Row: {
          candidatura_id: string | null
          created_at: string
          empresa: string
          id: string
          respostas: Json
          roteiro: Json
          titulo: string
          updated_at: string
          user_id: string
          vaga_id: string | null
        }
        Insert: {
          candidatura_id?: string | null
          created_at?: string
          empresa?: string
          id?: string
          respostas?: Json
          roteiro?: Json
          titulo: string
          updated_at?: string
          user_id: string
          vaga_id?: string | null
        }
        Update: {
          candidatura_id?: string | null
          created_at?: string
          empresa?: string
          id?: string
          respostas?: Json
          roteiro?: Json
          titulo?: string
          updated_at?: string
          user_id?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preparos_entrevista_candidatura_id_fkey"
            columns: ["candidatura_id"]
            isOneToOne: false
            referencedRelation: "candidaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparos_entrevista_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_encontradas"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_itens: {
        Row: {
          como_comprovar: string
          concluido_em: string | null
          created_at: string
          esforco: string
          habilidade: string
          horas_estimadas: number
          horas_feitas: number
          id: string
          nivel: string
          porque: string
          prioridade: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          como_comprovar?: string
          concluido_em?: string | null
          created_at?: string
          esforco?: string
          habilidade: string
          horas_estimadas?: number
          horas_feitas?: number
          id?: string
          nivel?: string
          porque?: string
          prioridade?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          como_comprovar?: string
          concluido_em?: string | null
          created_at?: string
          esforco?: string
          habilidade?: string
          horas_estimadas?: number
          horas_feitas?: number
          id?: string
          nivel?: string
          porque?: string
          prioridade?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_ritmo: {
        Row: {
          created_at: string
          dias_semana: number
          horas_dia: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_semana?: number
          horas_dia?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dias_semana?: number
          horas_dia?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_sessoes: {
        Row: {
          created_at: string
          dia: string
          horas: number
          id: string
          item_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dia?: string
          horas?: number
          id?: string
          item_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dia?: string
          horas?: number
          id?: string
          item_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sessoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uso_mensal: {
        Row: {
          competencia: string
          created_at: string
          id: string
          quantidade: number
          recurso: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competencia: string
          created_at?: string
          id?: string
          quantidade?: number
          recurso: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competencia?: string
          created_at?: string
          id?: string
          quantidade?: number
          recurso?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vagas_encontradas: {
        Row: {
          chave: string
          created_at: string
          descricao: string
          empresa: string
          fonte: string
          id: string
          link: string
          local: string
          modelo: string
          publicada_em: string | null
          salario: string
          titulo: string
          updated_at: string
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string
          empresa?: string
          fonte: string
          id?: string
          link: string
          local?: string
          modelo?: string
          publicada_em?: string | null
          salario?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string
          empresa?: string
          fonte?: string
          id?: string
          link?: string
          local?: string
          modelo?: string
          publicada_em?: string | null
          salario?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      vagas_usuario: {
        Row: {
          aberta_em: string | null
          compatibilidade: number
          created_at: string
          id: string
          lacunas: Json
          motivo: string
          motivo_remocao: string | null
          recomendacoes: Json | null
          removida_em: string | null
          status: string
          updated_at: string
          user_id: string
          vaga_id: string
        }
        Insert: {
          aberta_em?: string | null
          compatibilidade?: number
          created_at?: string
          id?: string
          lacunas?: Json
          motivo?: string
          motivo_remocao?: string | null
          recomendacoes?: Json | null
          removida_em?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vaga_id: string
        }
        Update: {
          aberta_em?: string | null
          compatibilidade?: number
          created_at?: string
          id?: string
          lacunas?: Json
          motivo?: string
          motivo_remocao?: string | null
          recomendacoes?: Json | null
          removida_em?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_usuario_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_encontradas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consumir_cota: {
        Args: { _limite: number; _recurso: string; _user_id: string }
        Returns: boolean
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
