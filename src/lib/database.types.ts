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
      alunos: {
        Row: {
          cpf: string
          created_at: string
          dia_vencimento: number
          faixa_atual: string
          grau_atual: number
          id: string
          mensalidade_valor: number
          modalidade_id: string
          professor_id: string
          profile_id: string | null
          status: Database["public"]["Enums"]["aluno_status"]
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          dia_vencimento: number
          faixa_atual: string
          grau_atual?: number
          id?: string
          mensalidade_valor: number
          modalidade_id: string
          professor_id: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["aluno_status"]
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          dia_vencimento?: number
          faixa_atual?: string
          grau_atual?: number
          id?: string
          mensalidade_valor?: number
          modalidade_id?: string
          professor_id?: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["aluno_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "alunos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      graduacoes_historico: {
        Row: {
          aluno_id: string
          created_at: string
          data_graduacao: string
          faixa: string
          grau: number
          id: string
          registrado_por: string | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_graduacao: string
          faixa: string
          grau: number
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_graduacao?: string
          faixa?: string
          grau?: number
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduacoes_historico_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduacoes_historico_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          categoria: string | null
          created_at: string
          estoque_minimo: number
          id: string
          nome: string
          preco_unitario: number | null
          status: Database["public"]["Enums"]["account_status"]
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome: string
          preco_unitario?: number | null
          status?: Database["public"]["Enums"]["account_status"]
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome?: string
          preco_unitario?: number | null
          status?: Database["public"]["Enums"]["account_status"]
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      modalidades: {
        Row: {
          created_at: string
          faixas_ordem: Json
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          faixas_ordem?: Json
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          faixas_ordem?: Json
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentos_estoque: {
        Row: {
          created_at: string
          data: string
          id: string
          material_id: string
          motivo: string | null
          observacao: string | null
          quantidade: number
          registrado_por: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento_estoque"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          material_id: string
          motivo?: string | null
          observacao?: string | null
          quantidade: number
          registrado_por?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento_estoque"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          material_id?: string
          motivo?: string | null
          observacao?: string | null
          quantidade?: number
          registrado_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimento_estoque"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_estoque_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          aluno_id: string
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          id: string
          mes_referencia: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"] | null
          observacao: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          updated_at: string
          valor: number
        }
        Insert: {
          aluno_id: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          id?: string
          mes_referencia: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"] | null
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          valor: number
        }
        Update: {
          aluno_id?: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          id?: string
          mes_referencia?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"] | null
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_confirmado_por_fkey"
            columns: ["confirmado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          created_at: string
          data_aula: string
          id: string
          observacao_aula: string | null
          presente: boolean
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_aula: string
          id?: string
          observacao_aula?: string | null
          presente?: boolean
          turma_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_aula?: string
          id?: string
          observacao_aula?: string | null
          presente?: boolean
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_modalidades: {
        Row: {
          created_at: string
          modalidade_id: string
          professor_id: string
        }
        Insert: {
          created_at?: string
          modalidade_id: string
          professor_id: string
        }
        Update: {
          created_at?: string
          modalidade_id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_modalidades_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_modalidades_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      professores: {
        Row: {
          comissao_percentual: number
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          comissao_percentual?: number
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          comissao_percentual?: number
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          capacidade_maxima: number
          created_at: string
          dias_semana: Database["public"]["Enums"]["dia_semana"][]
          hora_fim: string
          hora_inicio: string
          id: string
          local: string | null
          modalidade_id: string
          nome: string
          professor_id: string
          updated_at: string
        }
        Insert: {
          capacidade_maxima: number
          created_at?: string
          dias_semana?: Database["public"]["Enums"]["dia_semana"][]
          hora_fim: string
          hora_inicio: string
          id?: string
          local?: string | null
          modalidade_id: string
          nome: string
          professor_id: string
          updated_at?: string
        }
        Update: {
          capacidade_maxima?: number
          created_at?: string
          dias_semana?: Database["public"]["Enums"]["dia_semana"][]
          hora_fim?: string
          hora_inicio?: string
          id?: string
          local?: string | null
          modalidade_id?: string
          nome?: string
          professor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      account_status: "ativo" | "inativo"
      aluno_status: "ativo" | "inativo" | "trancado"
      dia_semana:
        | "domingo"
        | "segunda"
        | "terca"
        | "quarta"
        | "quinta"
        | "sexta"
        | "sabado"
      metodo_pagamento: "pix" | "dinheiro" | "cartao" | "outro"
      status_pagamento: "pendente" | "confirmado" | "atrasado"
      tipo_movimento_estoque: "entrada" | "saida"
      user_role: "admin" | "professor" | "aluno"
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
    Enums: {
      account_status: ["ativo", "inativo"],
      aluno_status: ["ativo", "inativo", "trancado"],
      dia_semana: [
        "domingo",
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
      ],
      metodo_pagamento: ["pix", "dinheiro", "cartao", "outro"],
      status_pagamento: ["pendente", "confirmado", "atrasado"],
      tipo_movimento_estoque: ["entrada", "saida"],
      user_role: ["admin", "professor", "aluno"],
    },
  },
} as const
