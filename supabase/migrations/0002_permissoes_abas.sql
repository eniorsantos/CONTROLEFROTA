-- Migration 0002: abas permitidas por usuário (controle de acesso por aba).
-- NULL = usa o padrão do perfil (admin: tudo; comercial: painel/editar/frota/importacao/relatorios;
-- operacao: painel/frota/os; leitura: painel/frota/relatorios). Ver src/lib/usuarios.ts.

alter table membros add column if not exists abas text[] default null;

comment on column membros.abas is 'Abas que o usuário pode acessar (ids: painel, editar, frota, os, importacao, relatorios, configuracoes, usuarios). NULL = padrão do perfil.';
