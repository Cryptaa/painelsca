-- Função para tornar o primeiro usuário admin automaticamente
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Se este for o primeiro usuário, torná-lo admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true) THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para tornar primeiro usuário admin
DROP TRIGGER IF EXISTS make_first_user_admin_trigger ON public.profiles;
CREATE TRIGGER make_first_user_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_user_admin();

-- Se você quiser tornar um usuário específico admin manualmente,
-- execute o comando abaixo substituindo o email:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'seu@email.com';