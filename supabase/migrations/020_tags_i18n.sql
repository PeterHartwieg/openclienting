-- ============================================================
-- OpenClienting.org — Tag i18n
-- Adds a German label column to the tag taxonomy. Fallback to
-- name (English) is handled in application code.
-- ============================================================

alter table public.tags
  add column if not exists name_de text;

-- Idempotent backfill for the seed tags from migration 003.
update public.tags
   set name_de = case slug
     when 'manufacturing'  then 'Fertigung'
     when 'logistics'      then 'Logistik'
     when 'retail'         then 'Einzelhandel'
     when 'energy'         then 'Energie'
     when 'construction'   then 'Bauwesen'
     when 'healthcare'     then 'Gesundheitswesen'
     when 'operations'     then 'Betrieb'
     when 'quality'        then 'Qualität'
     when 'procurement'    then 'Einkauf'
     when 'it'             then 'IT'
     when 'finance'        then 'Finanzen'
     when 'efficiency'     then 'Effizienz'
     when 'compliance'     then 'Compliance'
     when 'visibility'     then 'Transparenz'
     when 'cost_reduction' then 'Kostensenkung'
     when 'micro'          then 'Kleinstunternehmen'
     when 'small'          then 'Klein'
     when 'medium'         then 'Mittel'
     else name_de
   end
 where slug in (
   'manufacturing','logistics','retail','energy','construction','healthcare',
   'operations','quality','procurement','it','finance',
   'efficiency','compliance','visibility','cost_reduction',
   'micro','small','medium'
 );
