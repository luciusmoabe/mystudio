// Shim para window.storage usando localStorage
const storage = {
  get: async (key: string): Promise<{ value: string } | null> => {
    const val = localStorage.getItem(key);
    return val !== null ? { value: val } : null;
  },
  set: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
};

// Injeta no window para compatibilidade com o componente original
(window as any).storage = storage;

export default storage;
