
-- Update seed function to include platform accounts for new users
CREATE OR REPLACE FUNCTION public.seed_finance_accounts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pj_vinicius_id uuid;
  pf_vinicius_id uuid;
  pj_esposa_id uuid;
  pf_esposa_id uuid;
BEGIN
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PJ Vinicius', 'pj', 'Vinicius', '#3B82F6') RETURNING id INTO pj_vinicius_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PF Vinicius', 'pf', 'Vinicius', '#10B981') RETURNING id INTO pf_vinicius_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PJ Esposa', 'pj', 'Esposa', '#F59E0B') RETURNING id INTO pj_esposa_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PF Esposa', 'pf', 'Esposa', '#EC4899') RETURNING id INTO pf_esposa_id;

  -- Platform accounts
  INSERT INTO public.finance_accounts (user_id, name, type, owner, color) VALUES
    (NEW.id, 'Plataforma Keed', 'plataforma', 'Esposa', '#8B5CF6');
  INSERT INTO public.finance_accounts (user_id, name, type, owner, color) VALUES
    (NEW.id, 'Plataforma Five', 'plataforma', 'Vinicius', '#F97316');

  -- Seed envelopes
  INSERT INTO public.finance_envelopes (user_id, name, account_id, color) VALUES
    (NEW.id, 'Capital de Giro', pj_esposa_id, '#F59E0B'),
    (NEW.id, 'Anúncios PAD', pj_esposa_id, '#EF4444'),
    (NEW.id, 'Pró-labore Vinicius', pj_esposa_id, '#3B82F6'),
    (NEW.id, 'Pró-labore Esposa', pj_esposa_id, '#EC4899'),
    (NEW.id, 'Reserva de Emergência', pf_vinicius_id, '#10B981'),
    (NEW.id, 'Investimentos', pf_vinicius_id, '#8B5CF6'),
    (NEW.id, 'Despesas Fixas Casa', pf_vinicius_id, '#F97316'),
    (NEW.id, 'Consultoria', pj_vinicius_id, '#06B6D4');

  RETURN NEW;
END;
$function$;
