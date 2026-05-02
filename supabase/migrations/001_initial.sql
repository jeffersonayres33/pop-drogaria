-- =====================================================
-- POPs Drogaria – Supabase Migration
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── POPS TABLE ──────────────────────────────────────
create table if not exists pops (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  number      text not null,            -- "POP 01"
  description text not null default '',
  price       integer not null,         -- in BRL cents (e.g. 2990 = R$ 29,90)
  category    text not null default 'Geral',
  fields      jsonb not null default '[]',   -- PopField[]
  template    jsonb not null default '{}',   -- document template
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── ORDERS TABLE ────────────────────────────────────
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  pop_ids             uuid[] not null,
  total_cents         integer not null,
  status              text not null default 'pending'
                        check (status in ('pending','approved','rejected','expired')),
  mp_payment_id       text,
  download_token      text unique,
  download_used       boolean not null default false,
  download_expires_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────
create index if not exists orders_email_idx          on orders(email);
create index if not exists orders_token_idx          on orders(download_token);
create index if not exists orders_mp_payment_id_idx  on orders(mp_payment_id);
create index if not exists pops_active_idx           on pops(active);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pops_updated_at
  before update on pops
  for each row execute procedure update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────
alter table pops   enable row level security;
alter table orders enable row level security;

-- Public: read active POPs only
create policy "Public read active pops"
  on pops for select
  using (active = true);

-- Public: read own order by token (for download page)
create policy "Read order by token"
  on orders for select
  using (download_token is not null);

-- Service role bypasses RLS automatically ✓

-- ─── SEED: POP 01 example ────────────────────────────
insert into pops (title, number, description, price, category, fields, template) values (
  'Documentação',
  'POP 01',
  'Estabelecer a documentação necessária que a farmácia deverá possuir e renovar todos os anos para ficar em dia com os órgãos reguladores.',
  2990,
  'Administrativo',
  '[
    {"id":"razaoSocial","label":"Razão Social","placeholder":"DROGARIA SILVA LTDA - ME","type":"text","required":true,"section":"Estabelecimento","width":"full"},
    {"id":"cnpj","label":"CNPJ","placeholder":"00.000.000/0001-00","type":"text","required":true,"section":"Estabelecimento","width":"half"},
    {"id":"afe","label":"Nº AFE Anvisa","placeholder":"1.12345.6","type":"text","required":false,"section":"Estabelecimento","width":"half"},
    {"id":"endereco","label":"Endereço Completo","placeholder":"Rua, nº – Bairro – Cidade – UF – CEP","type":"text","required":false,"section":"Estabelecimento","width":"full"},
    {"id":"telefone","label":"Telefone","placeholder":"(00) 00000-0000","type":"text","required":false,"section":"Estabelecimento","width":"half"},
    {"id":"farmaceutico","label":"Farmacêutico RT","placeholder":"Nome completo","type":"text","required":true,"section":"Responsável Técnico","width":"full"},
    {"id":"crf","label":"CRF","placeholder":"24.832 RJ","type":"text","required":true,"section":"Responsável Técnico","width":"half"},
    {"id":"horario","label":"Horário de Trabalho","placeholder":"Seg a Sex 08h-18h","type":"text","required":false,"section":"Responsável Técnico","width":"half"},
    {"id":"dataElaboracao","label":"Data de Elaboração","type":"date","required":false,"section":"Documento","width":"half"},
    {"id":"dataRevisao","label":"Data da Revisão","type":"date","required":false,"section":"Documento","width":"half"},
    {"id":"versao","label":"Versão","placeholder":"01","type":"text","required":false,"section":"Documento","width":"half"},
    {"id":"revisao","label":"Nº Revisão","placeholder":"00","type":"text","required":false,"section":"Documento","width":"half"},
    {"id":"telCrf","label":"Tel. CRF","placeholder":"(21) 2240-3200","type":"text","required":false,"section":"Contatos","width":"half"},
    {"id":"telVisaEstadual","label":"Tel. Visa Estadual","placeholder":"(21) 2334-5600","type":"text","required":false,"section":"Contatos","width":"half"},
    {"id":"telVisaMunicipal","label":"Tel. Visa Municipal","placeholder":"(22) 2665-3300","type":"text","required":false,"section":"Contatos","width":"half"}
  ]'::jsonb,
  '{
    "mainTitle": "Procedimentos para Documentação",
    "sections": [
      {
        "number": "1",
        "title": "Objetivos",
        "blocks": [
          {"type":"paragraph","text":"Estabelecer a documentação necessária que a farmácia deverá possuir e renovar todos os anos para ficar em dia com os órgãos reguladores e estabelecer os documentos que deverão ser mantidos na área de atendimento para apresentação ao público e à fiscalização."}
        ]
      },
      {
        "number": "2",
        "title": "Áreas Envolvidas / Responsabilidade",
        "blocks": [
          {"type":"paragraph","text":"Administração  |  Farmacêutico Responsável"}
        ]
      },
      {
        "number": "3",
        "title": "Referências",
        "blocks": [
          {"type":"paragraph","text":"RDC Nº 44, DE 17 DE AGOSTO DE 2009"}
        ]
      },
      {
        "number": "4",
        "title": "Procedimentos",
        "blocks": [
          {"type":"paragraph","text":"a) A farmácia deve possuir os seguintes documentos:"},
          {"type":"list","items":["Autorização de Funcionamento de Empresa (AFE)","Alvará Sanitário","Certidão de Regularidade Técnica","Manual de Boas Práticas Farmacêuticas"]},
          {"type":"paragraph","text":"b) Afixar o Alvará Sanitário e a Certidão de Regularidade Técnica em local visível ao público."},
          {"type":"paragraph","text":"c) Afixar em local visível ao público, cartaz informativo contendo:"},
          {"type":"table","rows":[
            ["Razão Social:", "{{razaoSocial}}"],
            ["CNPJ:", "{{cnpj}}"],
            ["Número AFE Anvisa:", "{{afe}}"],
            ["Farmacêutico RT / CRF:", "{{farmaceutico}}  |  CRF: {{crf}}"],
            ["Horário do farmacêutico:", "{{horario}}"],
            ["Tel. CRF:", "{{telCrf}}"],
            ["Tel. Visa Estadual:", "{{telVisaEstadual}}"],
            ["Tel. Visa Municipal:", "{{telVisaMunicipal}}"]
          ]},
          {"type":"paragraph","text":"d) No início de cada ano, verificar os documentos, identificando o prazo de renovação de cada documento, informando a área administrativa para as devidas providências."},
          {"type":"paragraph","text":"e) Manter a documentação no estabelecimento por no mínimo 5 (cinco) anos, permanecendo, nesse período, à disposição do órgão de vigilância sanitária competente para fiscalização."}
        ]
      }
    ]
  }'::jsonb
);
