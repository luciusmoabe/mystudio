import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    if (mode === 'register' && password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return; }

    setLoading(true);
    if (mode === 'register') {
      const { error: err } = await signUp(email, password);
      if (err) setError(err.message || 'Erro ao criar conta.');
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        if (err.message?.includes('Invalid login')) setError('E-mail ou senha inválidos.');
        else setError(err.message || 'Erro ao entrar.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF8F5 0%, #F2EDE6 50%, #EAE4DB 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 420,
        maxWidth: '92vw',
        background: '#FFF',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        padding: '2.5rem 2.2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #C4A882, #9A7D5A)',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C4A882, #9A7D5A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24, color: '#fff',
          }}>📷</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#3D3530', letterSpacing: '-0.02em' }}>
            MyStudio
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#AFA49A' }}>
            Gestão profissional para fotógrafos
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderRadius: 10, overflow: 'hidden',
          border: '1px solid #EAE4DB', marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '0.6rem', border: 'none',
                fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer',
                background: mode === m ? '#C4A882' : 'transparent',
                color: mode === m ? '#fff' : '#7A6E65',
                transition: 'all 0.2s',
              }}>
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#7A6E65', marginBottom: 5, fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" autoComplete="email"
              style={{
                width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #EAE4DB',
                borderRadius: 10, fontSize: 14, color: '#3D3530', background: '#FDFBF8',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#C4A882'}
              onBlur={e => e.target.style.borderColor = '#EAE4DB'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#7A6E65', marginBottom: 5, fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #EAE4DB',
                borderRadius: 10, fontSize: 14, color: '#3D3530', background: '#FDFBF8',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#C4A882'}
              onBlur={e => e.target.style.borderColor = '#EAE4DB'}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7A6E65', marginBottom: 5, fontWeight: 500 }}>
                Confirmar senha
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" autoComplete="new-password"
                style={{
                  width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #EAE4DB',
                  borderRadius: 10, fontSize: 14, color: '#3D3530', background: '#FDFBF8',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#C4A882'}
                onBlur={e => e.target.style.borderColor = '#EAE4DB'}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: '#FBF0EF', border: '1px solid #DFB8B8', borderRadius: 8,
              padding: '0.6rem 0.9rem', marginBottom: 16,
            }}>
              <p style={{ margin: 0, fontSize: 12.5, color: '#8A3838' }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{
              background: '#E6EFE7', border: '1px solid #B5D4B8', borderRadius: 8,
              padding: '0.6rem 0.9rem', marginBottom: 16,
            }}>
              <p style={{ margin: 0, fontSize: 12.5, color: '#3D6B42' }}>{success}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '0.75rem', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: loading ? '#D8C9B4' : 'linear-gradient(135deg, #C4A882, #9A7D5A)',
              color: '#fff', cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(196,168,130,0.3)',
            }}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: 11, color: '#AFA49A' }}>
          © {new Date().getFullYear()} MyStudio · Gestão para fotógrafos
        </p>
      </div>
    </div>
  );
}
