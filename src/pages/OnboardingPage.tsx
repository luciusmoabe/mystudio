import { useState } from 'react';
import { useProfile, type StudioProfile } from '../hooks/useProfile';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function OnboardingPage() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Partial<StudioProfile>>({
    nome_estudio: '', nome_profissional: '', cpf: '', cnpj: '',
    endereco: '', cidade: '', uf: '', telefone: '', email: '',
  });
  const s = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const finish = async () => {
    setSaving(true);
    await saveProfile(f);
    setSaving(false);
    // O AuthGuard vai redirecionar automaticamente
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #EAE4DB',
    borderRadius: 10, fontSize: 14, color: '#3D3530', background: '#FDFBF8',
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    display: 'block' as const, fontSize: 12, color: '#7A6E65', marginBottom: 5, fontWeight: 500 as const,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF8F5 0%, #F2EDE6 50%, #EAE4DB 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 520, maxWidth: '94vw', background: '#FFF', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)', padding: '2.5rem 2.2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #C4A882, #9A7D5A)',
        }} />

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? '#C4A882' : '#EAE4DB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>👋</p>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#3D3530' }}>
                Bem-vindo ao MyStudio!
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#AFA49A' }}>
                Vamos configurar o seu estúdio em 2 passos rápidos
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div style={{ gridColumn: '1/-1', marginBottom: 16 }}>
                <label style={labelStyle}>Nome do estúdio *</label>
                <input style={inputStyle} value={f.nome_estudio} onChange={e => s('nome_estudio', e.target.value)}
                  placeholder="Ex: Ana Souza Photography" />
              </div>
              <div style={{ gridColumn: '1/-1', marginBottom: 16 }}>
                <label style={labelStyle}>Seu nome completo *</label>
                <input style={inputStyle} value={f.nome_profissional} onChange={e => s('nome_profissional', e.target.value)}
                  placeholder="Nome do profissional" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>CPF</label>
                <input style={inputStyle} value={f.cpf} onChange={e => s('cpf', e.target.value)}
                  placeholder="000.000.000-00" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>CNPJ (opcional)</label>
                <input style={inputStyle} value={f.cnpj} onChange={e => s('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00" />
              </div>
            </div>

            <button onClick={() => setStep(1)} disabled={!f.nome_estudio?.trim() || !f.nome_profissional?.trim()}
              style={{
                width: '100%', padding: '0.75rem', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                background: (!f.nome_estudio?.trim() || !f.nome_profissional?.trim()) ? '#D8C9B4' : 'linear-gradient(135deg, #C4A882, #9A7D5A)',
                color: '#fff', cursor: (!f.nome_estudio?.trim() || !f.nome_profissional?.trim()) ? 'default' : 'pointer',
                boxShadow: '0 4px 12px rgba(196,168,130,0.3)',
              }}>
              Próximo →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🏠</p>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#3D3530' }}>
                Contato e endereço
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#AFA49A' }}>
                Estas informações aparecerão nos seus contratos
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Telefone</label>
                <input style={inputStyle} value={f.telefone} onChange={e => s('telefone', e.target.value)}
                  placeholder="(00) 00000-0000" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>E-mail profissional</label>
                <input style={inputStyle} value={f.email} onChange={e => s('email', e.target.value)}
                  placeholder="contato@estudio.com" />
              </div>
              <div style={{ gridColumn: '1/-1', marginBottom: 16 }}>
                <label style={labelStyle}>Endereço</label>
                <input style={inputStyle} value={f.endereco} onChange={e => s('endereco', e.target.value)}
                  placeholder="Rua, nº, bairro" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Cidade</label>
                <input style={inputStyle} value={f.cidade} onChange={e => s('cidade', e.target.value)}
                  placeholder="Sua cidade" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>UF</label>
                <select style={inputStyle} value={f.uf} onChange={e => s('uf', e.target.value)}>
                  <option value="">Selecione...</option>
                  {UFS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 10, fontSize: 14, fontWeight: 500,
                  background: '#FFF', color: '#7A6E65', border: '1px solid #EAE4DB', cursor: 'pointer',
                }}>
                ← Voltar
              </button>
              <button onClick={finish} disabled={saving}
                style={{
                  flex: 2, padding: '0.75rem', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  background: saving ? '#D8C9B4' : 'linear-gradient(135deg, #C4A882, #9A7D5A)',
                  color: '#fff', cursor: saving ? 'default' : 'pointer',
                  boxShadow: '0 4px 12px rgba(196,168,130,0.3)',
                }}>
                {saving ? 'Salvando...' : '✅ Começar a usar'}
              </button>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: 11, color: '#AFA49A' }}>
          Você pode alterar essas informações depois em Configurações
        </p>
      </div>
    </div>
  );
}
