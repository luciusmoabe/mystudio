// Utilitários de impressão extraídos de App.tsx para evitar problemas com
// template literals HTML dentro de JSX (incompatível com parsers modernos)

export function buildPrintHtml(lines: string, sigHtml: string, clientSigHtml: string) {
  return (
    '<div style="padding:60px 70px;max-width:740px;margin:0 auto;">' +
    lines +
    '<div style="display:flex;gap:80px;margin-top:70px;">' +
    '<div><b>CONTRATADA:</b><br>Brenda Santos Monteiro' + sigHtml + '</div>' +
    '<div><b>CONTRATANTE:</b>' + clientSigHtml + '</div>' +
    '</div></div>'
  );
}

export function makeSigHtml(sig: string | null): string {
  return sig
    ? '<img src="' + sig + '" style="height:55px;display:block;margin-top:6px;"/>'
    : '<div style="border-bottom:1px solid #000;width:200px;margin-top:36px;"></div>';
}

export function makeLineHtml(l: string): string {
  return '<p style="margin:0 0 4px;font-size:13px;line-height:1.75;">' + (l || '&nbsp;') + '</p>';
}

export function printContract(txt: string, signature: string | null) {
  document.getElementById('bp')?.remove();
  document.getElementById('bps')?.remove();
  const mH = makeSigHtml(signature);
  const clientSig = '<div style="border-bottom:1px solid #000;width:200px;margin-top:36px;"></div>';
  const lines = txt.split('\n').map(makeLineHtml).join('');
  const d = document.createElement('div');
  d.id = 'bp';
  d.style.cssText = 'display:none;font-family:Georgia,serif;color:#000;';
  d.innerHTML = buildPrintHtml(lines, mH, clientSig);
  document.body.appendChild(d);
  const s = document.createElement('style');
  s.id = 'bps';
  s.textContent = '@media print{body>*:not(#bp){display:none!important}#bp{display:block!important}}';
  document.head.appendChild(s);
  window.print();
  setTimeout(() => {
    document.getElementById('bp')?.remove();
    document.getElementById('bps')?.remove();
  }, 2000);
}

export function printSignedContract(txt: string, mySig: string | null, clientSig: string | null) {
  document.getElementById('bp')?.remove();
  document.getElementById('bps')?.remove();
  const mH = makeSigHtml(mySig);
  const cH = makeSigHtml(clientSig);
  const lines = txt.split('\n').map(makeLineHtml).join('');
  const d = document.createElement('div');
  d.id = 'bp';
  d.style.cssText = 'display:none;font-family:Georgia,serif;color:#000;';
  d.innerHTML = buildPrintHtml(lines, mH, cH);
  document.body.appendChild(d);
  const s = document.createElement('style');
  s.id = 'bps';
  s.textContent = '@media print{body>*:not(#bp){display:none!important}#bp{display:block!important}}';
  document.head.appendChild(s);
  window.print();
  setTimeout(() => {
    document.getElementById('bp')?.remove();
    document.getElementById('bps')?.remove();
  }, 2000);
}
