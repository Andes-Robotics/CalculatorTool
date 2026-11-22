const BELTS = [
    {id:'Z',  nombre:'Trapezoidal clásica Z',  fam:'Trapezoidal clásica', maxI:7,  minD:50,  minWrap:120, uso:'Cargas livianas, motores chicos'},
    {id:'A',  nombre:'Trapezoidal clásica A',  fam:'Trapezoidal clásica', maxI:7,  minD:75,  minWrap:120, uso:'Uso general, ventiladores, compresores chicos'},
    {id:'B',  nombre:'Trapezoidal clásica B',  fam:'Trapezoidal clásica', maxI:7,  minD:125, minWrap:120, uso:'Uso general industrial'},
    {id:'C',  nombre:'Trapezoidal clásica C',  fam:'Trapezoidal clásica', maxI:7,  minD:200, minWrap:120, uso:'Cargas pesadas'},
    {id:'SPZ',nombre:'Trapezoidal estrecha SPZ',fam:'Trapezoidal estrecha',maxI:10, minD:63,  minWrap:120, uso:'Más potencia en menos ancho'},
    {id:'SPA',nombre:'Trapezoidal estrecha SPA',fam:'Trapezoidal estrecha',maxI:10, minD:90,  minWrap:120, uso:'Industria en general'},
    {id:'SPB',nombre:'Trapezoidal estrecha SPB',fam:'Trapezoidal estrecha',maxI:10, minD:140, minWrap:120, uso:'Cargas altas'},
    {id:'SPC',nombre:'Trapezoidal estrecha SPC',fam:'Trapezoidal estrecha',maxI:10, minD:224, minWrap:120, uso:'Cargas muy altas'},
    {id:'PJ', nombre:'Poly-V PJ',  fam:'Poly-V (acanalada)', maxI:10, minD:20, minWrap:120, uso:'Compacta, alta velocidad, electrodomésticos'},
    {id:'PK', nombre:'Poly-V PK',  fam:'Poly-V (acanalada)', maxI:10, minD:45, minWrap:120, uso:'Automotriz, accesorios de motor'},
    {id:'PL', nombre:'Poly-V PL',  fam:'Poly-V (acanalada)', maxI:10, minD:75, minWrap:120, uso:'Industrial pesado'},
    {id:'GT2',nombre:'Dentada GT2 (2 mm)',  fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:2,     minZ:16, uso:'Impresoras 3D, CNC liviano, robótica'},
    {id:'HTD3',nombre:'Dentada HTD 3M',     fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:3,     minZ:12, uso:'Automatización, robótica'},
    {id:'HTD5',nombre:'Dentada HTD 5M',     fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:5,     minZ:14, uso:'Maquinaria liviana a media'},
    {id:'HTD8',nombre:'Dentada HTD 8M',     fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:8,     minZ:22, uso:'Transmisión de potencia, sin deslizamiento'},
    {id:'XL', nombre:'Dentada trapezoidal XL', fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:5.08,  minZ:10, uso:'Equipos livianos y de oficina'},
    {id:'L',  nombre:'Dentada trapezoidal L',  fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:9.525, minZ:12, uso:'Maquinaria liviana a media'},
    {id:'H',  nombre:'Dentada trapezoidal H',  fam:'Sincrónica (dentada)', maxI:8, minD:0, minWrap:60, sync:true, pitch:12.7,  minZ:14, uso:'Maquinaria media'},
    {id:'FLAT',nombre:'Plana',   fam:'Plana y redonda', maxI:6, minD:50, minWrap:150, uso:'Alta velocidad, transportadores, silenciosa'},
    {id:'ROUND',nombre:'Redonda', fam:'Plana y redonda', maxI:3, minD:20, minWrap:120, uso:'Cargas muy livianas, transportadores chicos'}
];

const $ = id => document.getElementById(id);
const fmt = (x,n=1) => Number(x).toLocaleString('es-AR',{maximumFractionDigits:n});

(function fillSelect(){
    let h = '<option value="">Cualquiera (sugerime la mejor)</option>';
    [...new Set(BELTS.map(b=>b.fam))].forEach(f=>{
        h += `<optgroup label="${f}">` + BELTS.filter(b=>b.fam===f).map(b=>`<option value="${b.id}">${b.nombre}</option>`).join('') + '</optgroup>';
    });
    $('type').innerHTML = h;
})();


function geometry(i,L,C){
    const c = 2*C - L;
    if (c >= 0) return null;
    const a = (i-1)**2/(4*C), b = Math.PI*(i+1)/2;
    const d = a===0 ? -c/b : (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
    const D = d*i, s = (D-d)/(2*C);
    if (s >= 1) return null;
    const wrap = 180 - 2*Math.asin(s)*180/Math.PI;
    return {d, D, wrap};
}

function evaluate(b,i,L,C,g){
    const fail=[], warn=[], ok=[]; let score=100, extra={};
    if (i > b.maxI) fail.push(`La relación ${fmt(i,2)} supera el máximo típico (${b.maxI}:1).`);
    else ok.push(`Relación dentro del límite (${b.maxI}:1).`);
    if (g.wrap < b.minWrap) fail.push(`Arco de contacto de ${fmt(g.wrap,0)}°; se necesitan al menos ${b.minWrap}°.`);
    else ok.push(`Arco de contacto de ${fmt(g.wrap,0)}°.`);
    if (b.sync){
        const z = g.d*Math.PI/b.pitch, N = L/b.pitch, Nr = Math.round(N), err = Math.abs(L-Nr*b.pitch);
        extra = {z:Math.round(z), Nr, Lstd:Nr*b.pitch};
        if (z < b.minZ) fail.push(`La polea menor tendría ${fmt(z,0)} dientes; el mínimo es ${b.minZ}.`);
        if (err > b.pitch*0.12){ warn.push(`La longitud no es múltiplo del paso: la más cercana es ${Nr} dientes (${fmt(Nr*b.pitch,1)} mm).`); score -= 12; }
        else ok.push(`Longitud equivale a ${Nr} dientes.`);
        if (C < (g.D+g.d)/2) { warn.push('Distancia entre ejes muy corta para las poleas.'); score -= 10; }
        score += 4;                                // sin deslizamiento
    } else {
        if (g.d < b.minD) fail.push(`La polea menor (Ø${fmt(g.d,0)} mm) es menor al mínimo del perfil (Ø${b.minD} mm).`);
        else {
            ok.push(`Polea menor Ø${fmt(g.d,0)} mm (mínimo ${b.minD} mm).`);
            const r = g.d/b.minD; if (r > 4) { score -= Math.min(20,(r-4)*3); warn.push('Perfil algo chico para estas poleas; un perfil mayor transmitiría más potencia.'); }
        }
        const S = g.D+g.d;
        if (C < 0.7*S){ warn.push('Distancia entre ejes menor a 0,7·(D+d): poco recomendable.'); score -= 10; }
        if (C > 3*S){ warn.push('Distancia entre ejes mayor a 3·(D+d): puede vibrar.'); score -= 10; }
    }
    return {b, fail, warn, ok, extra, score: fail.length ? 0 : Math.max(1,score)};
}

function drawBelt(g,C){
    const r1=g.d/2, r2=g.D/2, phi=Math.asin((r2-r1)/C);
    const W=r1+C+r2, H=2*r2, k=Math.min(560/W,180/H), ox=20+r1*k, oy=110;
    const X=x=>ox+x*k, Y=y=>oy+y*k, s=Math.sin(phi), c=Math.cos(phi);
    const p1t=[-r1*s,-r1*c], p2t=[C-r2*s,-r2*c], p2b=[C-r2*s,r2*c], p1b=[-r1*s,r1*c];
    const P=p=>`${X(p[0])} ${Y(p[1])}`;
    const path=`M${P(p1t)} L${P(p2t)} A${r2*k} ${r2*k} 0 1 1 ${P(p2b)} L${P(p1b)} A${r1*k} ${r1*k} 0 0 1 ${P(p1t)}Z`;
    const pul=(cx,r)=>`<circle cx="${X(cx)}" cy="${Y(0)}" r="${r*k}" fill="none" stroke="var(--mute)" stroke-width="1.5"/><circle cx="${X(cx)}" cy="${Y(0)}" r="3" fill="var(--acc)"/>`;
    $('draw').innerHTML = `<path d="${path}" fill="none" stroke="var(--belt)" stroke-width="5" stroke-linejoin="round"/>${pul(0,r1)}${pul(C,r2)}
    <line x1="${X(0)}" y1="${Y(0)}" x2="${X(C)}" y2="${Y(0)}" stroke="var(--acc)" stroke-dasharray="5 4"/>`;
    $('drawcap').textContent = `Polea menor Ø${fmt(g.d,0)} mm · polea mayor Ø${fmt(g.D,0)} mm · entre ejes ${fmt(C,0)} mm · arco de contacto ${fmt(g.wrap,0)}°`;
}

function card(e,title){
    const li = (arr,cls)=>arr.map(t=>`<li class="${cls}">${t}</li>`).join('');
    const x = e.extra.Nr ? `<div class="kv"><span>Polea menor: <b>${e.extra.z} dientes</b></span><span>Correa: <b>${e.extra.Nr} dientes · ${fmt(e.extra.Lstd,1)} mm</b></span></div>` : '';
    return `<h2>${title}</h2><div class="kv"><span><b>${e.b.nombre}</b></span><span>${e.b.fam}</span></div>${x}<p style="margin:4px 0;color:var(--mute)">Aplicaciones típicas: ${e.b.uso}.</p><ul class="n">${li(e.fail,'f')}${li(e.warn,'w')}${li(e.ok,'g')}</ul>`;
}

function update(){
    const i=parseFloat($('ratio').value), L=parseFloat($('len').value), C=parseFloat($('dist').value), sel=$('type').value;
    const out=$('out');
    if (!(i>=1) || !(L>0) || !(C>0)){ out.innerHTML=''; return; }
    const g = geometry(i,L,C);
    if (!g){ out.innerHTML = `<div class="msg">Con estos datos la geometría no cierra: la longitud de la correa (${fmt(L,0)} mm) tiene que ser mayor que dos veces la distancia entre ejes (${fmt(2*C,0)} mm). Probá con una correa más larga o ejes más cercanos.</div>`; return; }
    drawBelt(g,C);
    const evals = BELTS.map(b=>evaluate(b,i,L,C,g)).sort((a,b)=>b.score-a.score);
    const best = evals[0];
    let html = '';
    if (sel){
        const mine = evals.find(e=>e.b.id===sel);
        html += `<div class="top">${card(mine, mine.fail.length ? 'No es compatible con estos datos' : 'Sirve para estos datos')}</div>`;
        if (best.b.id!==sel && best.score>0) html += `<div class="top" style="border-left-color:var(--ok)">${card(best,'Alternativa sugerida')}</div>`;
    } else if (best.score>0){
        html += `<div class="top">${card(best,'Te sugerimos comprar')}</div>`;
    } else {
        html += `<div class="msg">Ningún tipo de correa del listado es compatible con estos datos. Revisá la relación, la longitud y la distancia entre ejes.</div>`;
    }
    html += `<h2>Todos los tipos</h2><div class="wrap"><table><thead><tr><th>Tipo</th><th>Familia</th><th>Resultado</th></tr></thead><tbody>` +
        evals.map(e=>`<tr class="${e.b.id===sel?'sel':''}"><td>${e.b.nombre}</td><td>${e.b.fam}</td><td>${e.fail.length?`<span class="f">No: ${e.fail[0]}</span>`:e.warn.length?`<span class="w">Posible. ${e.warn[0]}</span>`:'<span class="g">Compatible</span>'}</td></tr>`).join('') + '</tbody></table></div>';
    out.innerHTML = html;
}
['ratio','len','dist'].forEach(id=>$(id).addEventListener('input',update));
$('type').addEventListener('change',update);
$('f').addEventListener('submit',e=>e.preventDefault());