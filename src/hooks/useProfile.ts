import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface StudioProfile {
  id?: string;
  user_id?: string;
  nome_estudio: string;
  nome_profissional: string;
  cpf: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  logo_url: string;
}

const EMPTY_PROFILE: StudioProfile = {
  nome_estudio: '',
  nome_profissional: '',
  cpf: '',
  cnpj: '',
  endereco: '',
  cidade: '',
  uf: '',
  telefone: '',
  email: '',
  logo_url: '',
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudioProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('perfil_estudio')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setProfile(data as StudioProfile);
      setHasProfile(true);
    } else {
      setHasProfile(false);
    }
    setLoading(false);
  };

  const saveProfile = async (data: Partial<StudioProfile>) => {
    if (!user) return;
    const payload = { ...profile, ...data, user_id: user.id };
    const { error } = await supabase
      .from('perfil_estudio')
      .upsert(payload, { onConflict: 'user_id' });

    if (!error) {
      setProfile(payload);
      setHasProfile(true);
    }
    return { error };
  };

  return { profile, loading, hasProfile, saveProfile, refetch: fetchProfile };
}
