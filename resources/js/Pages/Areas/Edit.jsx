/**
 * Reconstructed source from TilkiAdisyon production bundle
 * Original entry: resources/js/Pages/Areas/Edit.jsx
 * Bundle chunk: assets/Edit-C4AxWm5C.js
 */
import{u as d,j as e,H as m,L as u}from"./app-tgt1EkC5.js";import{A as c}from"./AppLayout-ZHF-BB9p.js";import{I as p,B as x}from"./Select-BaLHhRWb.js";import{C as f}from"./Card-J4tzdytf.js";function v({area:a}){const{data:t,setData:r,put:n,processing:l,errors:o}=d({name:a.name||""}),i=s=>{s.preventDefault(),n(route("areas.update",a.id))};return e.jsxs(c,{title:"Bölge Düzenle",children:[e.jsx(m,{title:"Bölge Düzenle"}),e.jsx("div",{className:"max-w-2xl mx-auto",children:e.jsx(f,{title:`${a.name} Düzenle`,children:e.jsxs("form",{onSubmit:i,className:"space-y-5",children:[e.jsx(p,{label:"Bölge Adı",value:t.name,onChange:s=>r("name",s.target.value),error:o.name}),e.jsxs("div",{className:"flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800",children:[e.jsx(u,{href:route("areas.index"),className:"btn-ghost",children:"İptal"}),e.jsx(x,{type:"submit",loading:l,children:"Güncelle"})]})]})})})]})}export{v as default};
